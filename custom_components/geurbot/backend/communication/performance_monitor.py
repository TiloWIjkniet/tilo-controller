
from collections import defaultdict, deque
import time


class PerformanceMonitor:
    def __init__(self):
        self.devices = defaultdict(lambda: defaultdict(self._create_endpoint))

    @staticmethod
    def _create_endpoint():
        return {
            "requests": 0,
            "success": 0,
            "errors": 0,
            "total_duration_ms": 0.0,
            "min_duration_ms": None,
            "max_duration_ms": 0.0,
            "last_duration_ms": 0.0,
            "total_response_bytes": 0,
            "status_codes": defaultdict(int),
            "timestamps": deque(maxlen=300),
            "samples": deque(maxlen=300)
        }

    def record(self, result, device_id):
        method = result.get("method", "UNKNOWN")
        endpoint = result.get("endpoint", "UNKNOWN")

        if endpoint == "/api/diagnostics/performance":
            return

        key = f"{method} {endpoint}"
        stats = self.devices[device_id][key]

        duration = float(result.get("duration_ms", 0.0))
        response_size = int(result.get("response_size", 0))
        status = result.get("status")
        success = result.get("success") is True
        now = time.time()

        stats["requests"] += 1
        stats["success"] += int(success)
        stats["errors"] += int(not success)
        stats["total_duration_ms"] += duration
        stats["last_duration_ms"] = duration
        stats["total_response_bytes"] += response_size

        if status is not None:
            stats["status_codes"][str(status)] += 1

        stats["min_duration_ms"] = (
            duration if stats["min_duration_ms"] is None
            else min(stats["min_duration_ms"], duration)
        )

        stats["max_duration_ms"] = max(stats["max_duration_ms"], duration)

        stats["timestamps"].append(now)
        stats["samples"].append({
            "timestamp": round(now * 1000),
            "duration_ms": round(duration, 2),
            "response_size": response_size,
            "status": status,
            "success": success
        })

    @staticmethod
    def _percentile(values, percentile):
        if not values:
            return 0

        values = sorted(values)
        index = min(len(values) - 1, int(len(values) * percentile))
        return round(values[index], 2)

    def get_stats(self, device_id):
        now = time.time()
        endpoints = self.devices.get(device_id, {})

        total_requests = 0
        total_success = 0
        total_errors = 0
        total_duration = 0.0
        total_bytes = 0
        total_requests_per_minute = 0
        endpoint_data = {}

        for key, stats in endpoints.items():
            requests = stats["requests"]
            samples = list(stats["samples"])

            average = (
                stats["total_duration_ms"] / requests
                if requests else 0
            )

            recent_durations = [
                sample["duration_ms"] for sample in samples
            ]

            requests_per_minute = sum(
                timestamp >= now - 60
                for timestamp in stats["timestamps"]
            )

            endpoint_data[key] = {
                "requests": requests,
                "success": stats["success"],
                "errors": stats["errors"],
                "success_rate": round(
                    stats["success"] / requests * 100, 2
                ) if requests else 0,

                "average_duration_ms": round(average, 2),
                "min_duration_ms": round(
                    stats["min_duration_ms"] or 0, 2
                ),
                "max_duration_ms": round(
                    stats["max_duration_ms"], 2
                ),
                "last_duration_ms": round(
                    stats["last_duration_ms"], 2
                ),
                "p95_duration_ms": self._percentile(
                    recent_durations, 0.95
                ),

                "requests_per_minute": requests_per_minute,
                "average_response_bytes": round(
                    stats["total_response_bytes"] / requests, 2
                ) if requests else 0,
                "total_response_bytes": stats["total_response_bytes"],
                "status_codes": dict(stats["status_codes"]),
                "samples": samples
            }

            total_requests += requests
            total_success += stats["success"]
            total_errors += stats["errors"]
            total_duration += stats["total_duration_ms"]
            total_bytes += stats["total_response_bytes"]
            total_requests_per_minute += requests_per_minute

        return {
            "success": True,
            "generated_at": round(now * 1000),

            "overview": {
                "total_requests": total_requests,
                "successful_requests": total_success,
                "failed_requests": total_errors,
                "success_rate": round(
                    total_success / total_requests * 100, 2
                ) if total_requests else 0,
                "average_duration_ms": round(
                    total_duration / total_requests, 2
                ) if total_requests else 0,
                "total_response_bytes": total_bytes,
                "requests_per_minute": total_requests_per_minute,
                "endpoint_count": len(endpoint_data)
            },

            "endpoints": endpoint_data
        }


performance_monitor = PerformanceMonitor()
