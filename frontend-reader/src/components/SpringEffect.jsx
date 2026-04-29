import { useEffect } from "react";

export default function SpringEffect() {
  useEffect(() => {
    const interval = setInterval(() => {
      const flower = document.createElement("div");
      flower.innerText = "🌸";
      flower.className =
        "fixed top-0 text-xl pointer-events-none animate-fall";
      flower.style.left = Math.random() * window.innerWidth + "px";
      flower.style.opacity = Math.random();
      document.body.appendChild(flower);

      setTimeout(() => flower.remove(), 5000);
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return null;
}
