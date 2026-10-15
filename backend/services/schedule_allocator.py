import json
import logging
import random
from datetime import datetime, timedelta, time, date
from typing import Optional, Tuple, List, Dict
import pytz
from sqlalchemy.orm import Session

from models import Channel, UploadTask
from schemas import QueueStatusEnum

logger = logging.getLogger("ScheduleAllocator")

class ScheduleAllocator:
    @staticmethod
    def get_channel_pipeline_config(channel: Channel, pipeline_type: str) -> dict:
        """Extract and normalize pipeline configuration for a channel."""
        account_pipelines = {}
        if channel and channel.pipelines:
            try:
                account_pipelines = json.loads(channel.pipelines) if isinstance(channel.pipelines, str) else channel.pipelines
            except Exception as e:
                logger.warning(f"Failed to parse pipelines for channel {channel.id}: {e}")

        p_cfg = account_pipelines.get(pipeline_type, {}) if isinstance(account_pipelines, dict) else {}
        
        # Schedule list e.g. ["08:00"]
        schedule_list = p_cfg.get("schedule")
        if not isinstance(schedule_list, list) or len(schedule_list) == 0:
            schedule_list = ["08:00"]

        # Daily limit (default 1)
        try:
            daily_limit = int(p_cfg.get("daily_limit", 1) or 1)
        except Exception:
            daily_limit = 1
        if daily_limit <= 0:
            daily_limit = 1

        # Humanize jitter
        h_cfg = p_cfg.get("humanize") or {}
        humanize_enabled = bool(h_cfg.get("enabled", False))
        try:
            humanize_min = int(h_cfg.get("min_delay_minutes", 0) or 0)
            humanize_max = int(h_cfg.get("max_delay_minutes", 0) or 0)
        except Exception:
            humanize_min, humanize_max = 0, 0

        tz_str = getattr(channel, "publish_timezone", None) or "Asia/Jakarta"
        try:
            tz = pytz.timezone(tz_str)
        except Exception:
            tz = pytz.timezone("Asia/Jakarta")

        schedule_mode = p_cfg.get("schedule_mode", "application")

        return {
            "schedule_list": schedule_list,
            "daily_limit": daily_limit,
            "humanize_enabled": humanize_enabled,
            "humanize_min": humanize_min,
            "humanize_max": humanize_max,
            "tz": tz,
            "tz_str": tz_str,
            "schedule_mode": schedule_mode,
            "pipeline_config": p_cfg
        }

    @staticmethod
    def allocate_slot(
        db: Session,
        channel_id: str,
        pipeline_type: str = "long",
        exclude_task_id: Optional[str] = None,
        starting_date: Optional[date] = None
    ) -> Tuple[datetime, str]:
        """
        Calculates the next guaranteed free schedule date and time slot for a channel and pipeline.
        Considers already COMPLETED (uploaded), UPLOADING, QUEUED, SCHEDULED, and REVIEW tasks.
        Strictly obeys channel's daily_limit without overflowing onto the same day.
        """
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        config = ScheduleAllocator.get_channel_pipeline_config(channel, pipeline_type)
        
        tz = config["tz"]
        daily_limit = config["daily_limit"]
        schedule_list = config["schedule_list"]
        now_local = datetime.now(tz)

        # 1. Gather all tasks for this channel & pipeline that consume upload slots
        query = db.query(UploadTask).filter(
            UploadTask.channel_id == channel_id,
            UploadTask.pipeline_type == pipeline_type,
            UploadTask.status.in_([
                QueueStatusEnum.completed,
                QueueStatusEnum.uploading,
                QueueStatusEnum.queued,
                QueueStatusEnum.scheduled,
                QueueStatusEnum.watched,
                QueueStatusEnum.review
            ])
        )
        if exclude_task_id:
            query = query.filter(UploadTask.id != exclude_task_id)
        
        existing_tasks = query.all()

        # 2. Map date occupancy in local channel timezone
        date_occupancy: Dict[date, List[datetime]] = {}
        for task in existing_tasks:
            target_dt_utc = None
            if task.scheduled_at:
                target_dt_utc = task.scheduled_at
            elif task.completed_at and task.status == QueueStatusEnum.completed:
                target_dt_utc = task.completed_at
            
            if target_dt_utc:
                try:
                    if target_dt_utc.tzinfo is None:
                        dt_local = pytz.UTC.localize(target_dt_utc).astimezone(tz)
                    else:
                        dt_local = target_dt_utc.astimezone(tz)
                    
                    d_key = dt_local.date()
                    if d_key not in date_occupancy:
                        date_occupancy[d_key] = []
                    date_occupancy[d_key].append(dt_local)
                except Exception as ex:
                    logger.debug(f"Error parsing task timestamp for occupancy: {ex}")

        # 3. Search day by day for the next vacant slot
        start_date = starting_date or now_local.date()
        chosen_dt_local: Optional[datetime] = None

        for day_offset in range(365):
            candidate_date = start_date + timedelta(days=day_offset)
            occupied_list = date_occupancy.get(candidate_date, [])

            # If daily limit reached, this day is completely full
            if len(occupied_list) >= daily_limit:
                continue

            # Determine available slots on this day
            candidate_slots = []
            for idx in range(daily_limit):
                if idx < len(schedule_list):
                    t_str = str(schedule_list[idx])
                else:
                    # Distribute between 09:00 and 21:00
                    step = (21 - 9) / max(1, daily_limit - 1)
                    t_str = f"{int(9 + idx * step):02d}:00"
                
                try:
                    parts = t_str.split(":")
                    slot_h = int(parts[0])
                    slot_m = int(parts[1]) if len(parts) > 1 else 0
                    slot_dt = tz.localize(datetime.combine(candidate_date, time(slot_h, slot_m)))
                    candidate_slots.append(slot_dt)
                except Exception:
                    slot_dt = tz.localize(datetime.combine(candidate_date, time(8, 0)))
                    candidate_slots.append(slot_dt)

            # Check candidate slots for this day
            for s_dt in candidate_slots:
                # If candidate date is TODAY: ensure slot is in the future
                if candidate_date == now_local.date():
                    if s_dt <= now_local + timedelta(minutes=10):
                        continue  # Already passed or too soon today

                # Check if collides with any occupied slot on that day
                collides = False
                for occ_dt in occupied_list:
                    if abs((s_dt - occ_dt).total_seconds()) < 1200:  # 20 minutes window
                        collides = True
                        break
                
                if not collides:
                    chosen_dt_local = s_dt
                    break

            if chosen_dt_local is not None:
                break

        # Fallback if no slot found in 365 days
        if chosen_dt_local is None:
            chosen_dt_local = tz.localize(datetime.combine(now_local.date() + timedelta(days=1), time(8, 0)))

        # 4. Apply humanize delay if enabled
        if config["humanize_enabled"] and config["humanize_min"] <= config["humanize_max"] and config["humanize_max"] > 0:
            jitter = random.randint(config["humanize_min"], config["humanize_max"])
            chosen_dt_local += timedelta(minutes=jitter)
            if chosen_dt_local.date() == now_local.date() and chosen_dt_local <= now_local + timedelta(minutes=5):
                chosen_dt_local = now_local + timedelta(minutes=10)

        scheduled_at_utc = chosen_dt_local.astimezone(pytz.UTC).replace(tzinfo=None)
        schedule_time_str = chosen_dt_local.strftime("%H:%M")

        return scheduled_at_utc, schedule_time_str

    @staticmethod
    def realign_channel_queue(
        db: Session,
        channel_id: Optional[str] = None,
        pipeline_type: Optional[str] = None
    ) -> List[UploadTask]:
        """
        Realigns pending/review/scheduled tasks in sequential order without overlaps.
        Guarantees that each day only has up to daily_limit tasks, starting after already-uploaded tasks.
        """
        query = db.query(UploadTask).filter(
            UploadTask.status.in_([
                QueueStatusEnum.watched,
                QueueStatusEnum.review,
                QueueStatusEnum.scheduled
            ])
        )
        if channel_id:
            query = query.filter(UploadTask.channel_id == channel_id)
        if pipeline_type:
            query = query.filter(UploadTask.pipeline_type == pipeline_type)

        # Order tasks by existing scheduled date or created date
        tasks_to_realign = query.order_by(
            UploadTask.created_at.asc()
        ).all()

        if not tasks_to_realign:
            return []

        # Group by channel and pipeline
        from collections import defaultdict
        grouped = defaultdict(list)
        for t in tasks_to_realign:
            grouped[(t.channel_id, t.pipeline_type or "long")].append(t)

        updated_tasks = []

        for (ch_id, p_type), tasks in grouped.items():
            channel = db.query(Channel).filter(Channel.id == ch_id).first()
            if not channel:
                continue

            config = ScheduleAllocator.get_channel_pipeline_config(channel, p_type)
            tz = config["tz"]
            now_local = datetime.now(tz)
            daily_limit = config["daily_limit"]
            schedule_list = config["schedule_list"]

            # Query non-movable tasks: COMPLETED, UPLOADING, QUEUED
            fixed_tasks = db.query(UploadTask).filter(
                UploadTask.channel_id == ch_id,
                UploadTask.pipeline_type == p_type,
                UploadTask.status.in_([
                    QueueStatusEnum.completed,
                    QueueStatusEnum.uploading,
                    QueueStatusEnum.queued
                ])
            ).all()

            # Build fixed occupancy map
            occupancy: Dict[date, List[datetime]] = {}
            for ft in fixed_tasks:
                ts = ft.scheduled_at or ft.completed_at
                if ts:
                    try:
                        if ts.tzinfo is None:
                            d_local = pytz.UTC.localize(ts).astimezone(tz)
                        else:
                            d_local = ts.astimezone(tz)
                        d_k = d_local.date()
                        if d_k not in occupancy:
                            occupancy[d_k] = []
                        occupancy[d_k].append(d_local)
                    except Exception:
                        pass

            # Now sequentially assign each task to the next available day/slot
            current_search_date = now_local.date()

            for task in tasks:
                chosen_dt: Optional[datetime] = None

                for day_offset in range(365):
                    cand_date = current_search_date + timedelta(days=day_offset)
                    occ_list = occupancy.get(cand_date, [])

                    if len(occ_list) >= daily_limit:
                        continue  # Date full

                    # Build candidate slots
                    cand_slots = []
                    for s_idx in range(daily_limit):
                        if s_idx < len(schedule_list):
                            s_str = str(schedule_list[s_idx])
                        else:
                            step = (21 - 9) / max(1, daily_limit - 1)
                            s_str = f"{int(9 + s_idx * step):02d}:00"
                        
                        try:
                            parts = s_str.split(":")
                            sh = int(parts[0])
                            sm = int(parts[1]) if len(parts) > 1 else 0
                            s_dt = tz.localize(datetime.combine(cand_date, time(sh, sm)))
                            cand_slots.append(s_dt)
                        except Exception:
                            cand_slots.append(tz.localize(datetime.combine(cand_date, time(8, 0))))

                    for slot_dt in cand_slots:
                        if cand_date == now_local.date() and slot_dt <= now_local + timedelta(minutes=10):
                            continue

                        # Check collision with already allocated tasks
                        collision = any(abs((slot_dt - o).total_seconds()) < 1200 for o in occ_list)
                        if not collision:
                            chosen_dt = slot_dt
                            break

                    if chosen_dt is not None:
                        # Found slot!
                        if cand_date not in occupancy:
                            occupancy[cand_date] = []
                        occupancy[cand_date].append(chosen_dt)
                        # Advance current_search_date to avoid unnecessary scans
                        current_search_date = cand_date
                        break

                if chosen_dt is None:
                    chosen_dt = tz.localize(datetime.combine(now_local.date() + timedelta(days=1), time(8, 0)))

                # Apply humanize delay if enabled
                if config["humanize_enabled"] and config["humanize_min"] <= config["humanize_max"] and config["humanize_max"] > 0:
                    jitter = random.randint(config["humanize_min"], config["humanize_max"])
                    chosen_dt += timedelta(minutes=jitter)

                task.scheduled_at = chosen_dt.astimezone(pytz.UTC).replace(tzinfo=None)
                task.schedule_time = chosen_dt.strftime("%H:%M")
                task.schedule_mode = config["schedule_mode"]
                updated_tasks.append(task)

        db.commit()
        for t in updated_tasks:
            db.refresh(t)

        logger.info(f"[ScheduleAllocator] Successfully realigned {len(updated_tasks)} tasks")
        return updated_tasks
