import React from "react";

import { Minesweeper } from "components/Minesweeper";

export default function IndexPage() {
  return (
    <main className="mx-auto" style={{ maxWidth: 800 }}>
      <h1 className="text-center font-bold text-3xl my-8">minesweeper</h1>
      <Minesweeper />
    </main>
  );
}
