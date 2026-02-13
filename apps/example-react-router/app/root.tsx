import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "react-grep";

const Root = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>react-grep + React Router</title>
      <Meta />
      <Links />
    </head>
    <body>
      <Outlet />
      <ScrollRestoration />
      <Scripts />
    </body>
  </html>
);

export default Root;
