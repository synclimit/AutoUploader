"""campaign_assets

Revision ID: c59d55d6d053
Revises: 3b349eb34bc6
Create Date: 2026-07-10 14:52:26.300005

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c59d55d6d053'
down_revision: Union[str, Sequence[str], None] = '3b349eb34bc6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'campaign_assets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('channel_id', sa.String(), nullable=True),
        sa.Column('campaign_id', sa.String(), nullable=True),
        sa.Column('fingerprint', sa.String(), nullable=False),
        sa.Column('fingerprint_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('sha256', sa.String(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('filesize', sa.Integer(), nullable=False),
        sa.Column('duration_seconds', sa.Float(), nullable=False),
        sa.Column('source_type', sa.String(), nullable=True),
        sa.Column('asset_origin', sa.String(), nullable=True, server_default='LOCAL_FOLDER'),
        sa.Column('youtube_video_id', sa.String(), nullable=True),
        sa.Column('scheduled_publish_at', sa.DateTime(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('allow_reupload', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('archived_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('fingerprint')
    )
    op.create_index(op.f('ix_campaign_assets_channel_id'), 'campaign_assets', ['channel_id'], unique=False)
    op.create_index(op.f('ix_campaign_assets_campaign_id'), 'campaign_assets', ['campaign_id'], unique=False)
    op.create_index(op.f('ix_campaign_assets_youtube_video_id'), 'campaign_assets', ['youtube_video_id'], unique=False)
    op.create_index(op.f('ix_campaign_assets_fingerprint'), 'campaign_assets', ['fingerprint'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_campaign_assets_fingerprint'), table_name='campaign_assets')
    op.drop_index(op.f('ix_campaign_assets_youtube_video_id'), table_name='campaign_assets')
    op.drop_index(op.f('ix_campaign_assets_campaign_id'), table_name='campaign_assets')
    op.drop_index(op.f('ix_campaign_assets_channel_id'), table_name='campaign_assets')
    op.drop_table('campaign_assets')
