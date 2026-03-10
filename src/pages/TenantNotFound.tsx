import { motion } from "framer-motion";
import { StoreIcon, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantNotFoundProps {
  slug: string;
}

const TenantNotFound = ({ slug }: TenantNotFoundProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[hsl(240,10%,6%)]">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-[hsl(250,65%,30%)] opacity-20 blur-[120px]"
          style={{ top: "-10%", left: "-10%" }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-[hsl(280,60%,35%)] opacity-15 blur-[100px]"
          style={{ bottom: "-5%", right: "-5%" }}
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[hsl(250,65%,55%/0.15)] border border-[hsl(250,65%,55%/0.2)] mb-8"
        >
          <StoreIcon className="w-10 h-10 text-[hsl(250,65%,70%)]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Business Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-lg text-[hsl(240,5%,55%)] mb-2"
        >
          The business at{" "}
          <span className="font-mono text-[hsl(250,65%,70%)] font-medium">
            {slug}.rinasfit.com
          </span>{" "}
          does not exist yet.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-[hsl(240,5%,45%)] mb-10"
        >
          Want to create it? Register your tailoring business on RinasFit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-[hsl(250,65%,55%)] hover:bg-[hsl(250,65%,48%)] text-white gap-2 px-8 rounded-xl text-base shadow-[0_4px_24px_hsl(250,65%,55%/0.3)]"
          >
            <a href="https://rinasfit.com/register-business">
              Register Your Business <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[hsl(240,8%,20%)] text-[hsl(240,5%,70%)] hover:bg-[hsl(240,8%,12%)] hover:text-white gap-2 rounded-xl text-base"
          >
            <a href="https://rinasfit.com">
              <Home className="w-4 h-4" /> Go to RinasFit Home
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-16 text-xs text-[hsl(240,5%,30%)]"
        >
          Powered by <span className="font-semibold text-[hsl(240,5%,40%)]">Rina's Fit</span>
        </motion.div>
      </div>
    </div>
  );
};

export default TenantNotFound;
