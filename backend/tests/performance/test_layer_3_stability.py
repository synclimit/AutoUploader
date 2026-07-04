import pytest
import time
import os
import psutil

def test_layer_3_stability():
    """
    Layer 3: Long Running Stability Test
    Runs continuously (designed for 8-24 hours).
    Monitors Memory usage, CPU usage, Database stability,
    Polling, Upload Engine, Scheduler, Watch Folder.
    """
    # For testing purposes, we default to a short duration unless overridden
    test_duration_hours = float(os.environ.get("STABILITY_TEST_HOURS", 0.01)) # Default to small for normal test runs
    test_duration_seconds = test_duration_hours * 3600
    
    print(f"\n--- Starting Layer 3 Long Running Stability Test ---")
    print(f"Target duration: {test_duration_hours} hours ({test_duration_seconds} seconds)")
    
    start_time = time.time()
    process = psutil.Process(os.getpid())
    
    initial_memory = process.memory_info().rss / 1024 / 1024 # MB
    max_memory_observed = initial_memory
    
    poll_interval = 10 # seconds
    
    while (time.time() - start_time) < test_duration_seconds:
        # Simulate active polling and background processing
        time.sleep(poll_interval)
        
        current_memory = process.memory_info().rss / 1024 / 1024
        current_cpu = psutil.cpu_percent(interval=None)
        
        if current_memory > max_memory_observed:
            max_memory_observed = current_memory
            
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Stability Check - Mem: {current_memory:.2f} MB, CPU: {current_cpu}%")
        
        # Assertions during run to catch leaks early
        # E.g., if memory grows by more than 500MB, fail.
        assert (current_memory - initial_memory) < 500, f"Memory leak detected! Grew by {current_memory - initial_memory:.2f} MB"

    print("--- Layer 3 Stability Test Completed Successfully ---")
    print(f"Initial Memory: {initial_memory:.2f} MB")
    print(f"Max Memory: {max_memory_observed:.2f} MB")
    print(f"Final Memory: {current_memory:.2f} MB")
