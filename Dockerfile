FROM hayd/alpine-deno:1.3.0

# Install pandoc-citeproc
RUN wget https://github.com/jgm/pandoc/releases/download/2.10.1/pandoc-2.10.1-linux-amd64.tar.gz && tar xvzf pandoc-2.10.1-linux-amd64.tar.gz --strip-components 1 -C /usr/local/ && rm pandoc-2.10.1-linux-amd64.tar.gz

# The port that your application listens to.
EXPOSE 1993

WORKDIR /app

# Prefer not to run as root.
USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY deps.ts .
RUN deno cache deps.ts

# These steps will be re-run upon each file change in your working directory:
ADD . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD ["run", "--allow-read", "--allow-run", "--allow-net", "main.ts"]
