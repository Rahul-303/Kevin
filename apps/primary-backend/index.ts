import { prisma } from "db/client";
import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware";

const app = express();

app.use(express.json());
app.use(cors());

app.post("/project", authMiddleware, async (req, res) => {
  //add logic to get useful name from the promts
  const { prompts } = req.body.prompts;
  const userId = req.userId!;
  const description = prompts.split("\n")[0];
  const project = await prisma.project.create({
    data: { description, userId },
  });
  res.json({ projectId: project.id });
});

app.get("/projects", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const projects = await prisma.project.findFirst({
    where: { userId: userId },
  });
  res.json(projects);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
