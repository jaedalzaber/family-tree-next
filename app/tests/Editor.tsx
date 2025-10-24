'use client';

import React, { useRef, useState, useEffect } from "react";

type EditorProps = {
    children?: React.ReactNode;
    initialScale?: number;
    minScale?: number;
    maxScale?: number;
    gridSize?: number;
    background?: string;
};

export default function Editor({
    children,
    initialScale = 1,
    minScale = 0.1,
    maxScale = 4,
    gridSize = 32,
    background = "#f7f7f7",
}: EditorProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Pan/zoom state (in CSS pixels)
    const [scale, setScale] = useState<number>(initialScale);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Pointer tracking for panning and pinch-to-zoom
    const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
    const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
    const lastPinchDist = useRef<number | null>(null);

    // Helper: clamp
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

    // Convert client point to world (canvas) coordinates before transform
    const clientToWorld = (clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: clientX, y: clientY };
        // container top-left is origin; world point = (client - rect - offset) / scale
        return {
            x: (clientX - rect.left - offset.x) / scale,
            y: (clientY - rect.top - offset.y) / scale,
        };
    };

    // Keep transform style computed
    const transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;

    // Pointer events
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Prevent browser gestures interfering
        el.style.touchAction = "none";

        const onPointerDown = (e: PointerEvent) => {
            (e.target as Element).setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (pointers.current.size === 1) {
                lastPanPoint.current = { x: e.clientX, y: e.clientY };
            } else if (pointers.current.size === 2) {
                // initialize pinch
                const pts = Array.from(pointers.current.values());
                lastPinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            }
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!pointers.current.has(e.pointerId)) return;
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (pointers.current.size === 1) {
                // panning
                const last = lastPanPoint.current;
                if (!last) return;
                const dx = e.clientX - last.x;
                const dy = e.clientY - last.y;
                lastPanPoint.current = { x: e.clientX, y: e.clientY };
                setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
            } else if (pointers.current.size === 2) {
                // pinch zoom
                const pts = Array.from(pointers.current.values());
                const newDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                const prevDist = lastPinchDist.current;
                if (prevDist && newDist > 0) {
                    const factor = newDist / prevDist;
                    const midpoint = {
                        x: (pts[0].x + pts[1].x) / 2,
                        y: (pts[0].y + pts[1].y) / 2,
                    };

                    // zoom around midpoint
                    setScale((s) => {
                        const newScale = clamp(s * factor, minScale, maxScale);
                        // adjust offset so the world point under midpoint stays stable
                        const world = clientToWorld(midpoint.x, midpoint.y);
                        setOffset((o) => {
                            const newOx = midpoint.x - world.x * newScale;
                            const newOy = midpoint.y - world.y * newScale;
                            return { x: newOx, y: newOy };
                        });
                        return newScale;
                    });
                }
                lastPinchDist.current = newDist;
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            pointers.current.delete(e.pointerId);
            lastPanPoint.current = null;
            if (pointers.current.size < 2) lastPinchDist.current = null;
            try {
                (e.target as Element).releasePointerCapture(e.pointerId);
            } catch {}
        };

        el.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        return () => {
            el.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
        };
    }, [minScale, maxScale, offset.x, offset.y, scale]); // offset/scale included to avoid stale closures

    // Wheel zoom (mouse)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            // Use ctrlKey or metaKey to require modifier? Not necessary; keep default to wheel zoom with ctrl pressed OR with wheel+shift? We'll zoom when Ctrl or Meta is pressed, otherwise allow scroll?
            // To make it intuitive, if it's a touchpad (deltaMode 0) zoom with ctrl, else if ctrlKey pressed also zoom. For simplicity, we'll always zoom with wheel+ctrl or wheel with Alt/Meta
            const wantZoom = e.ctrlKey || e.metaKey;
            if (!wantZoom) return;

            e.preventDefault();

            const rect = el.getBoundingClientRect();
            const clientX = e.clientX;
            const clientY = e.clientY;

            const zoomFactor = Math.exp(-e.deltaY * 0.0012); // smooth factor
            const newScale = clamp(scale * zoomFactor, minScale, maxScale);

            // world point under cursor before zoom
            const world = clientToWorld(clientX, clientY);

            // compute new offset so that world point stays under cursor
            setOffset((o) => {
                const newOx = clientX - world.x * newScale;
                const newOy = clientY - world.y * newScale;
                return { x: newOx, y: newOy };
            });

            setScale(newScale);
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [scale, minScale, maxScale]);

    // Double-click to reset view
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onDbl = (e: MouseEvent) => {
            setScale(initialScale);
            setOffset({ x: 0, y: 0 });
        };
        el.addEventListener("dblclick", onDbl);
        return () => el.removeEventListener("dblclick", onDbl);
    }, [initialScale]);

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
            }}
        >
            {/* Infinite-looking grid canvas layer */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    // grid is drawn in a layer that will be transformed (panned & zoomed)
                    // background uses repeating linear gradients for a subtle grid
                    backgroundImage: `
                        repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent ${gridSize}px),
                        repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent ${gridSize}px)
                    `,
                    backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
                    transformOrigin: "0 0",
                    transform,
                    willChange: "transform",
                }}
            >
                {/* content layer that lives on the same transformed plane */}
                <div style={{ position: "absolute", left: 0, top: 0 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}