FROM python:3.12-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends git g++ make libpcre3-dev ca-certificates && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/craigsapp/humextra.git /humextra && cd /humextra && git checkout 3247806c845b76d5fc932a3a73a5a2bce701f23b
WORKDIR /humextra
RUN mkdir -p obj lib && make -f Makefile.library -j2 library PREFLAGS='-O2 -c -std=c++14 -Iinclude -Iexternal/centerpoint/include -DLINUX' && for tool in tindex themax theloc; do g++ -O2 -std=c++14 -Iinclude cli/$tool.cpp -Llib -lhumextra -lpcre -o /usr/local/bin/$tool; done
FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libpcre3 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir gunicorn==23.0.0
COPY --from=build /usr/local/bin/tindex /usr/local/bin/themax /usr/local/bin/theloc /usr/local/bin/
WORKDIR /app
COPY . /app/
RUN python -c "import engine; from pathlib import Path; engine.BIN=Path('/usr/local/bin'); engine.build(Path('/app/scores'),Path('/app/index.json'))" && python -c "import json; r=json.load(open('index.json')); assert r and all('index' in x for x in r)"
RUN useradd --uid 10001 --no-create-home appuser
USER 10001
ENV PORT=8080
CMD ["sh","-c","exec gunicorn --bind 0.0.0.0:${PORT} --workers 1 --threads 1 --timeout 120 --access-logfile - app:application"]
