import {createApp, serveStatic} from "https://deno.land/x/servest@v1.1.3/mod.ts";

const app = createApp();

app.use(serveStatic("./public"));

async function runCiteproc(input: string): Promise<Uint8Array> {
	const p = Deno.run({
		cmd: ['pandoc-citeproc', '--bib2json', '-f', 'bibtex'],
		stdin: "piped",
		stdout: "piped"
	});

	if (!p.stdin) throw Error();

	await p.stdin.write(new TextEncoder().encode(input));
	await p.stdin.close();

	const { code } = await p.status();

	if (code === 0) {
		return await p.output();
	} else {
		console.log("pandoc-citeproc failed :(");
		throw Error();
	}
}

app.post('/bibtex', async (req) => {
    const citeproc = await runCiteproc(await req.text());

    await req.respond({
        status: 200,
        headers: new Headers({
            "content-type": "application/json",
        }),
        body: citeproc,
    });
});

app.handle(/^\/doi\/(10.\d{4,9}\/[-._;()\/:A-Z0-9]+$)/gmi, async (req) => {
  if (req.match.length < 2) throw Error();
  const doi = req.match[1];

  const bibtexResponse = await fetch(`https://doi.org/${doi}`, {
    headers: {
      'Accept': 'application/x-bibtex; charset=utf-8'
    }
  });

  if (!bibtexResponse.body) throw Error();

  const citeproc = await runCiteproc(await bibtexResponse.text());

  await req.respond({
    status: 200,
    headers: new Headers({
      "content-type": "application/json",
    }),
    body: citeproc,
  });
});

app.listen({ port: 8899 });
