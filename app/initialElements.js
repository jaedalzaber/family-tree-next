import { s } from "framer-motion/client";

export const treeRootId = "f";

export const initialTree = {
  f: {
    id: "f",
    name: "Father",
    type: "input",
    spouses: ["m1"],
    children: ["c1"],
  },
  m1: {
    id: "m1",
    name: "First Wife",
    isSpouse: true,
    children: ["c1"],
  },

  c1: {
    id: "c1",
    name: "Child 1",
    parents: ["f", "m1"],
    spouses: [],
    children: [],
  },

};
