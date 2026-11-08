export const inject = ['sessionController', 'webServer'];

export function apply(ctx) {
  ctx.webServer.register({kind: 'prefix', path: '/__test/sessions', handler: async (req, res) => {
    let source = '';
    for await (const chunk of req) source += chunk;
    const method = new URL(req.url, 'http://fixture').pathname.split('/').at(-1);
    try {
      const value = await ctx.sessionController[method](JSON.parse(source), new AbortController().signal);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(value));
    } catch (error) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: error.message}));
    }
  }});
}
