import os
import sys
import logging
import uvicorn

logger = logging.getLogger("iad_domain_server")


def main(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logger.info(f"Starting Industrial Benchmark Domain Server on http://{host}:{port}")
    uvicorn.run("iad_domain_server.api:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    host = os.environ.get("IAD_DOMAIN_SERVER_HOST", "0.0.0.0")
    port = int(os.environ.get("IAD_DOMAIN_SERVER_PORT", "8000"))
    main(host=host, port=port)
