import express, { Request, Response } from "express";
import { teamBuilderAgent } from "../agents/teamBuilderAgent";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { project, requirements } = req.body;
  try {
    const result = await teamBuilderAgent(project, requirements || "");
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: "Failed to build team" });
  }
});

export default router;
