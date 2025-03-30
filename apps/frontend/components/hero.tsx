'use client'

import { motion } from 'motion/react'
import { containerVariants, itemVariants } from '@/lib/animation-variants'

export const Hero = () => {
	return (
	   <motion.div
	     variants={containerVariants}
	     initial="hidden"
	     animate="visible"
	   >
              <motion.h1 variants={itemVariants} className="text-center text-3xl font-medium tracking-tighter sm:text-5xl drop-shadow-sm">
                Bring your ideas to reality
              </motion.h1>

              <motion.div variants={itemVariants} className="group flex items-center justify-center">
                <p
                  className="mt-4 w-fit rounded-full text-center border border-purple-300/30 dark:border-purple-300/10 font-semibold bg-purple-300 dark:bg-purple-300/5 tracking-wide text-purple-400/80 dark:text-purple-300/70 px-4 py-1 transition-all duration-300 ease-in-out"
                >
                  try pouring your ideas into this promt
                </p>
              </motion.div>
	   </motion.div>
	)	
}