"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface MousePosition {
  x: number;
  y: number;
}

function MousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return mousePosition;
}

interface GridParticlesProps {
  className?: string;
  columns?: number;
  rows?: number;
  mobileColumns?: number;
  mobileRows?: number;
  mobileBreakpoint?: number;
  nodeSize?: number;
  lineWidth?: number;
  hoverRadius?: number;
  color?: string;
  glowIntensity?: number;
}

interface GridNode {
  x: number;
  y: number;
  connections: {
    node: GridNode;
    opacity: number;
  }[];
  opacity: number;
}

function hexToRgb(hex: string): number[] {
  if (!hex || typeof hex !== 'string') {
    return [177, 157, 219]; // Default lavender color if hex is invalid
  }
  
  hex = hex.replace("#", "");
  
  // Check if hex is valid
  if (!/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return [177, 157, 219]; // Default lavender color if hex is invalid
  }
  
  try {
    const hexInt = parseInt(hex, 16);
    const red = (hexInt >> 16) & 255;
    const green = (hexInt >> 8) & 255;
    const blue = hexInt & 255;
    return [red, green, blue];
  } catch (e) {
    return [177, 157, 219]; // Default lavender color if parsing fails
  }
}

export const GridParticles: React.FC<GridParticlesProps> = ({
  className = "",
  columns = 15,
  rows = 8,
  mobileColumns = 8,
  mobileRows = 5,
  mobileBreakpoint = 768,
  nodeSize = 2,
  lineWidth = 0.5,
  hoverRadius = 150,
  color = "#b39ddb", // Lavender color
  glowIntensity = 0.8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const mousePosition = MousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  // Initialize with proper typing to avoid "possibly undefined" errors
  const gridNodes = useRef<GridNode[][]>([]);
  const isInitialized = useRef<boolean>(false);

  const [gridDimensions, setGridDimensions] = useState({
    columns: Math.max(1, columns || 15),
    rows: Math.max(1, rows || 8),
  });

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    resizeCanvas();
    createGrid();
    isInitialized.current = true;
  }, [gridDimensions, color]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      
      if (window.innerWidth < (mobileBreakpoint || 768)) {
        setGridDimensions({
          columns: Math.max(1, mobileColumns || 8),
          rows: Math.max(1, mobileRows || 5),
        });
      } else {
        setGridDimensions({
          columns: Math.max(1, columns || 15),
          rows: Math.max(1, rows || 8),
        });
      }
    };

    handleResize();
    
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", handleResize);
      
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [columns, rows, mobileColumns, mobileRows, mobileBreakpoint]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    try {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        context.current = ctx;
        initCanvas();
        animate();
      }
    } catch (error) {
      console.error("Error initializing canvas context:", error);
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", initCanvas);
      
      return () => {
        window.removeEventListener("resize", initCanvas);
      };
    }
  }, [color, initCanvas]);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition.x, mousePosition.y]);

  const onMouseMove = () => {
    if (!canvasRef.current || typeof mousePosition.x === 'undefined' || typeof mousePosition.y === 'undefined') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    if (!rect) return;
    
    const { w, h } = canvasSize.current;
    if (typeof w === 'undefined' || typeof h === 'undefined') return;
    
    const x = mousePosition.x - rect.left;
    const y = mousePosition.y - rect.top;
    const inside = x >= 0 && x <= w && y >= 0 && y <= h;
    
    if (inside) {
      mouse.current.x = x;
      mouse.current.y = y;
    } else {
      mouse.current.x = -1000; // Move far away when outside
      mouse.current.y = -1000;
    }
  };

  const resizeCanvas = () => {
    if (!canvasRef.current || !context.current || typeof window === 'undefined') return;
    
    try {
      canvasSize.current.w = window.innerWidth;
      canvasSize.current.h = window.innerHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `100vw`;
      canvasRef.current.style.height = `100vh`;
      context.current.scale(dpr, dpr);
    } catch (error) {
      console.error("Error resizing canvas:", error);
    }
  };

  const createGrid = () => {
    if (!context.current) return;
    
    try {
      const { w, h } = canvasSize.current;
      if (typeof w === 'undefined' || typeof h === 'undefined') return;
      
      const { columns, rows } = gridDimensions;
      if (columns <= 0 || rows <= 0) return;
      
      const cellWidth = w / columns;
      const cellHeight = h / rows;
      
      // Reset grid with a properly sized array initialized with empty arrays
      gridNodes.current = Array(rows + 1).fill(null).map(() => []);
      
      // Create nodes
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= columns; x++) {
          if (gridNodes.current[y]) { // This check is redundant now but TypeScript needs it
            gridNodes.current[y][x] = {
              x: x * cellWidth,
              y: y * cellHeight,
              connections: [],
              opacity: 0.1,
            };
          }
        }
      }
      
      // Create connections - with proper type checking
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= columns; x++) {
          const currentRow = gridNodes.current[y];
          if (!currentRow) continue;
          
          const currentNode = currentRow[x];
          if (!currentNode) continue;
          
          // Connect horizontally (right)
          if (x < columns) {
            const rightNode = currentRow[x + 1];
            if (rightNode) {
              currentNode.connections.push({ node: rightNode, opacity: 0.05 });
            }
          }
          
          // Connect vertically (down)
          if (y < rows) {
            const downRow = gridNodes.current[y + 1];
            if (downRow) {
              const downNode = downRow[x];
              if (downNode) {
                currentNode.connections.push({ node: downNode, opacity: 0.05 });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error creating grid:", error);
    }
  };

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
        typeof x2 !== 'number' || typeof y2 !== 'number') {
      return Infinity;
    }
    
    try {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    } catch (error) {
      return Infinity;
    }
  };

  const rgb = hexToRgb(color);

  const clearContext = () => {
    if (!context.current) return;
    
    try {
      const { w, h } = canvasSize.current;
      if (typeof w === 'undefined' || typeof h === 'undefined') return;
      
      context.current.clearRect(0, 0, w, h);
    } catch (error) {
      console.error("Error clearing context:", error);
    }
  };

  const animate = () => {
    if (!context.current || !isInitialized.current) {
      requestAnimationFrame(animate);
      return;
    }
    
    try {
      clearContext();
      const ctx = context.current;
      
      if (!gridNodes.current || !gridNodes.current.length) {
        requestAnimationFrame(animate);
        return;
      }

      // Update opacities based on mouse distance
      for (let y = 0; y < gridNodes.current.length; y++) {
        const currentRow = gridNodes.current[y];
        if (!currentRow) continue;
        
        for (let x = 0; x < currentRow.length; x++) {
          const node = currentRow[x];
          if (!node) continue;
          
          const distance = calculateDistance(mouse.current.x, mouse.current.y, node.x, node.y);
          const radius = hoverRadius || 150;
          
          // Node opacity
          if (distance < radius) {
            const intensity = (1 - distance / radius) * (glowIntensity || 0.8);
            node.opacity = 0.1 + intensity * 0.9;
          } else {
            node.opacity = 0.1;
          }
          
          // Connection opacity
          if (!node.connections) continue;
          
          for (let i = 0; i < node.connections.length; i++) {
            const connection = node.connections[i];
            if (!connection || !connection.node) continue;
            
            const connDistance = Math.min(
              distance,
              calculateDistance(mouse.current.x, mouse.current.y, connection.node.x, connection.node.y)
            );
            
            if (connDistance < radius) {
              const intensity = (1 - connDistance / radius) * (glowIntensity || 0.8);
              connection.opacity = 0.05 + intensity * 0.4;
            } else {
              connection.opacity = 0.05;
            }
          }
        }
      }
      
      // Draw connections first
      ctx.lineCap = "round";
      for (let y = 0; y < gridNodes.current.length; y++) {
        const currentRow = gridNodes.current[y];
        if (!currentRow) continue;
        
        for (let x = 0; x < currentRow.length; x++) {
          const node = currentRow[x];
          if (!node || !node.connections) continue;
          
          for (let i = 0; i < node.connections.length; i++) {
            const connection = node.connections[i];
            if (!connection || !connection.node) continue;
            
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connection.node.x, connection.node.y);
            ctx.lineWidth = lineWidth || 0.5;
            ctx.strokeStyle = `rgba(${rgb.join(", ")}, ${connection.opacity})`;
            ctx.stroke();
          }
        }
      }
      
      // Draw nodes on top
      for (let y = 0; y < gridNodes.current.length; y++) {
        const currentRow = gridNodes.current[y];
        if (!currentRow) continue;
        
        for (let x = 0; x < currentRow.length; x++) {
          const node = currentRow[x];
          if (!node) continue;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeSize || 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.join(", ")}, ${node.opacity})`;
          ctx.fill();
        }
      }
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
    
    requestAnimationFrame(animate);
  };

  return (
    <div
      className={`${className} fixed inset-0 -z-[100]`}
      ref={canvasContainerRef}
      aria-hidden="true">
      <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
};