import React from "react";
import { useState } from "react";
import "./App.css";
function App() {
    const [count, setCount] = useState(0);
    return (React.createElement(React.Fragment, null,
        React.createElement("h1", null, "Vite + React"),
        React.createElement("div", { className: "card" },
            React.createElement("button", { onClick: () => setCount((count) => count + 1) },
                "count is ",
                count),
            React.createElement("p", null,
                "Edit ",
                React.createElement("code", null, "src/App.tsx"),
                " and save to test HMR")),
        React.createElement("p", { className: "read-the-docs" }, "Click on the Vite and React logos to learn more")));
}
export default App;
