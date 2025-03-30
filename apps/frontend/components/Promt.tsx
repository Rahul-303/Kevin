"use client";

import { useState, useEffect, useRef } from "react";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";
import { Textarea } from "./ui/textarea";
import { useAuth } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { MoveUpRight, ChevronRight } from "lucide-react";
import axios from "axios";
import { frameworks, prompts } from "@/lib/constants";
import { motion } from "motion/react";
import { containerVariants, itemVariants } from "@/lib/animation-variants";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function Prompt() {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("NEXTJS");

  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.focus();
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) {
      setIsSignedIn(true);
      return;
    }
    const response = await axios.post(
      `${BACKEND_URL}/project`,
      {
        prompt: prompt,
        type: type,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    router.push(`/project/${response.data.projectId}?initPrompt=${prompt}`);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div className="px-4 py-2 sm:static sm:w-auto fixed bottom-0 left-0 w-full">
        {/* <div className="flex flex-row gap-2 mb-4">
          <Button variant={type === "REACT" ? "default" : "outline"} onClick={() => setType("REACT")}>
            React
          </Button>
          <Button variant={type === "NEXTJS" ? "default" : "outline"} onClick={() => setType("NEXTJS")}>
            NextJS
          </Button>
          <Button variant={type === "REACT_NATIVE" ? "default" : "outline"} onClick={() => setType("REACT_NATIVE")}>
            React Native
          </Button>
        </div> */}
        <motion.form
          variants={itemVariants}
          onSubmit={(e) => onSubmit(e)}
          className="relative w-full border-2 bg-gray-500/10 focus-within:outline-1 focus-within:outline-purple-300 rounded-xl"
        >
          <div className="p-2">
            <Textarea
              ref={promptRef}
              value={prompt}
              placeholder="Write your prompt here..."
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full placeholder:text-gray-400/60 bg-transparent border-none shadow-none text-md rounded-none focus-visible:ring-0 min-h-16 max-h-80 resize-none outline-none"
            />
          </div>

          <div className="p-2 flex items-center justify-end">
            <Button
              type="submit"
              className="h-10 w-10 cursor-pointer rounded-full bg-purple-300 border dark:bg-purple-300/10 hover:bg-purple-300/20 flex items-center justify-center"
              disabled={!prompt}
            >
              <MoveUpRight className="w-10 h-10 text-purple-400 dark:text-purple-400/80" />
            </Button>
          </div>
        </motion.form>
      </div>

      <motion.div
        variants={itemVariants}
        className="flex flex-row flex-wrap mt-4 sm:flex-nowrap w-full gap-2 sm:gap-2 justify-center items-center"
      >
        {prompts.map((prompt) => (
          <div
            onClick={() => setPrompt(prompt.title)}
            key={prompt.id}
            className="border dark:border-zinc-800 hover:bg-zinc-600/10 dark:bg-zinc-900 cursor-pointer px-4 py-2 rounded-xl"
          >
            <p className="text-gray-400/80 text-sm">{prompt.title}</p>
          </div>
        ))}
      </motion.div>

      <motion.div className="flex flex-row flex-wrap mt-4 sm:flex-nowrap w-full gap-2 sm:gap-2 justify-center items-center">
        <p>Select a framework</p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex flex-row flex-wrap mt-4 sm:flex-nowrap w-full gap-2 sm:gap-2 justify-center items-center"
      >
        {frameworks.map((framework) => (
          <div
            onClick={() => setType(framework.id)}
            key={framework.id}
            className={`border dark:border-zinc-800 hover:bg-zinc-600/10 dark:bg-zinc-900 cursor-pointer px-4 py-2 rounded-xl ${
              type === framework.id ? "bg-purple-300 dark:bg-purple-400" : ""
            }`}
          >
            <p
              className={` text-sm ${type === framework.id ? "text-purple-400" : "text-purple-900"}`}
            >
              {framework.label}
            </p>
          </div>
        ))}
      </motion.div>

      <AlertDialog open={isSignedIn} onOpenChange={setIsSignedIn}>
        <AlertDialogContent className="border-2 border-purple-300/10 bg-purple-900/90 text-white/70 rounded-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <ChevronRight className="text-purple-300/60" />
              <AlertDialogTitle className="">
                You are not signed in
              </AlertDialogTitle>
              <div></div>
            </div>
            <AlertDialogDescription className="text-white/80">
              Please sign in to access this feature. Your data is safe and will
              not be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer text-white hover:text-purple-300 focus-visible:outline-none focus-visible:ring-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer text-white hover:text-purple-300">
              Sign in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
