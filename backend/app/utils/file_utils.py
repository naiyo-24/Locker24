def format_size(size_bytes: int) -> str:
    """Formats a size in bytes into a human-readable string."""
    if size_bytes == 0:
        return "0B"
    size_name = ("B", "KB", "MB", "GB", "TB")
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_name[i]}"


import re
def parse_size(size_str: str) -> int:
    """Parses a human-readable size string back into bytes."""
    if not size_str:
        return 0
    match = re.match(r"^([\d.]+)\s*([A-Za-z]+)?$", size_str.strip())
    if not match:
        return 0
    value = float(match.group(1))
    unit = (match.group(2) or "B").upper()
    multipliers = {
        "B": 1,
        "KB": 1024,
        "MB": 1024 ** 2,
        "GB": 1024 ** 3,
        "TB": 1024 ** 4
    }
    return int(value * multipliers.get(unit, 1))
