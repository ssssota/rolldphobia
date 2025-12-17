import { render } from "preact";
import "./index.css";
import "virtual:uno.css";
import { App } from "./app.tsx";

render(<App />, document.getElementById("app")!);
