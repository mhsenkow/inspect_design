"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { Insight, InsightLink } from "../types";
import styles from "../../styles/components/network.module.css";

interface CrossLink {
  sourceId: string;
  targetId: string;
  label: string;
}

interface HybridNetworkProps {
  data: Insight[];
  crossLinks: CrossLink[];
  onNodeClick?: (insight: Insight) => void;
}

type SimNode = d3.SimulationNodeDatum & {
  id: string;
  insight: Insight;
  depth: number;
  hasChildren: boolean;
};

type SimLink = d3.SimulationLinkDatum<SimNode> & {
  kind: "hierarchy" | "cross";
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const HybridRadialNetwork: React.FC<HybridNetworkProps> = ({
  data,
  crossLinks,
  onNodeClick,
}) => {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomApiRef = useRef<{
    zoomBy: (factor: number) => void;
    fit: () => void;
  } | null>(null);
  const [totalNodeCount, setTotalNodeCount] = useState(0);
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [canZoom, setCanZoom] = useState(false);
  const [preview, setPreview] = useState<{
    insight: Insight;
    depth: number;
    hasChildren: boolean;
    left: number;
    top: number;
  } | null>(null);
  const hidePreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNodeNavigate = useMemo(
    () => (insight: Insight) => {
      if (onNodeClick) {
        onNodeClick(insight);
        return;
      }
      if (insight.uid) {
        router.push(`/insights/${insight.uid}`);
      }
    },
    [onNodeClick, router],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.max(240, Math.floor(rect.width));
      const height = Math.max(220, Math.floor(rect.height));
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svgEl = svgRef.current;
    const width = size.width;
    const height = size.height;

    if (!data || data.length === 0) {
      setTotalNodeCount(0);
      setCanZoom(false);
      setPreview(null);
      zoomApiRef.current = null;
      d3.select(svgEl).selectAll("*").remove();
      return;
    }

    const insightMap = new Map<string, Insight>();

    const populateMap = (items: Insight[]) => {
      for (const item of items) {
        if (item.uid && !insightMap.has(item.uid)) {
          insightMap.set(item.uid, item);
        }

        if (item.children && item.children.length > 0) {
          const childNodes = item.children
            .map(
              (link: InsightLink) =>
                link.childInsight || (link as unknown as Insight),
            )
            .filter((c): c is Insight => !!c && typeof c === "object");
          populateMap(childNodes);
        }
      }
    };

    populateMap(data);

    const resolveChild = (link: InsightLink): Insight | undefined => {
      const fallbackUid = (link as unknown as Partial<Insight>).uid;
      const childObj = link.childInsight
        ? insightMap.get(link.childInsight.uid!) || link.childInsight
        : fallbackUid
          ? insightMap.get(fallbackUid) || (link as unknown as Insight)
          : undefined;
      return childObj && childObj.title ? childObj : undefined;
    };

    const roots = data.filter(
      (i) =>
        !!i.uid &&
        (!i.parents ||
          i.parents.length === 0 ||
          !i.parents.some(
            (p) => p.parentInsight && insightMap.has(p.parentInsight.uid!),
          )),
    );

    const nodes: SimNode[] = [];
    const nodeById = new Map<string, SimNode>();
    const links: SimLink[] = [];
    const linkKeys = new Set<string>();

    const addNode = (insight: Insight, depth: number) => {
      if (!insight.uid || nodeById.has(insight.uid)) {
        return nodeById.get(insight.uid!);
      }
      const hasChildren = !!(
        insight.children &&
        insight.children.some((link) => !!resolveChild(link))
      );
      const node: SimNode = {
        id: insight.uid,
        insight,
        depth,
        hasChildren,
      };
      nodes.push(node);
      nodeById.set(insight.uid, node);
      return node;
    };

    const addLink = (
      sourceId: string,
      targetId: string,
      kind: SimLink["kind"],
    ) => {
      const key = `${kind}:${sourceId}->${targetId}`;
      if (linkKeys.has(key) || sourceId === targetId) return;
      if (!nodeById.has(sourceId) || !nodeById.has(targetId)) return;
      linkKeys.add(key);
      links.push({ source: sourceId, target: targetId, kind });
    };

    const walk = (insight: Insight, depth: number) => {
      addNode(insight, depth);
      if (!insight.children?.length || !insight.uid) return;
      for (const link of insight.children) {
        const child = resolveChild(link);
        if (!child?.uid) continue;
        const existed = nodeById.has(child.uid);
        addNode(child, existed ? nodeById.get(child.uid)!.depth : depth + 1);
        addLink(insight.uid, child.uid, "hierarchy");
        if (!existed) walk(child, depth + 1);
      }
    };

    for (const root of roots) {
      walk(root, 0);
    }

    // Include any filtered insights that weren't reachable as children
    for (const insight of data) {
      if (insight.uid && !nodeById.has(insight.uid)) {
        walk(insight, 0);
      }
    }

    for (const cross of crossLinks) {
      addLink(cross.sourceId, cross.targetId, "cross");
    }

    setTotalNodeCount(nodes.length);

    if (nodes.length === 0) {
      d3.select(svgEl).selectAll("*").remove();
      return;
    }

    const area = width * height;
    const density = Math.sqrt(area / Math.max(nodes.length, 1));
    const isCompact = width < 520 || nodes.length > 14;
    const cardWidth = clamp(
      density * (isCompact ? 0.48 : 0.58),
      isCompact ? 132 : 152,
      isCompact ? 176 : 200,
    );
    const cardHeight = clamp(
      cardWidth * 0.44,
      isCompact ? 58 : 66,
      isCompact ? 78 : 88,
    );
    // Keep cards close — just enough clearance to avoid overlap
    const collideRadius = Math.hypot(cardWidth, cardHeight) / 2 + 10;
    const linkDistance = Math.max(
      collideRadius * 1.55,
      clamp(density * 0.55, 90, 170),
    );
    const chargeStrength = -clamp(area / (nodes.length * 7.5), 90, 380);

    const titleType = (raw: string | undefined) => {
      const text = (raw || "Untitled").trim() || "Untitled";
      const len = text.length;
      const availW = cardWidth - 28;
      const availH = cardHeight - 22;
      const targetLines = len <= 22 ? 1 : len <= 48 ? 2 : 3;
      const charsPerLine = Math.max(10, Math.ceil(len / targetLines));
      const fromWidth = availW / (charsPerLine * 0.52);
      const fromHeight = availH / (targetLines * 1.28);
      const fontSize = clamp(Math.min(fromWidth, fromHeight), 12.5, 16);
      const lengthClass =
        len <= 22
          ? styles.nodeTitleShort
          : len <= 48
            ? styles.nodeTitleMedium
            : styles.nodeTitleLong;
      return { text, fontSize, lengthClass, targetLines };
    };

    // Seed on a tighter viewport-filling grid
    const aspect = width / Math.max(height, 1);
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length * aspect)));
    const rows = Math.max(1, Math.ceil(nodes.length / cols));
    const marginX = cardWidth * 0.4 + 12;
    const marginY = cardHeight * 0.4 + 12;
    const usableW = Math.max(width - marginX * 2, cardWidth);
    const usableH = Math.max(height - marginY * 2, cardHeight);
    const stepX = cols === 1 ? 0 : usableW / (cols - 1 || 1);
    const stepY = rows === 1 ? 0 : usableH / (rows - 1 || 1);
    nodes.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const jitterX = ((index * 37) % 7) - 3;
      const jitterY = ((index * 53) % 7) - 3;
      node.x = cols === 1 ? width / 2 : marginX + stepX * col + jitterX;
      node.y = rows === 1 ? height / 2 : marginY + stepY * row + jitterY;
    });

    const svg = d3
      .select(svgEl)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    const zoomGroup = svg.append("g").attr("class", "zoom-container");

    const isNodeEventTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(`.${styles.networkNode}`) ||
          target.closest(`.${styles.nodeHit}`) ||
          target.closest(`.${styles.nodeCard}`) ||
          target.closest("foreignObject"),
      );
    };

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 3.5])
      .filter((event) => {
        // Allow wheel/pinch always; don't steal pan from node hover/click/drag
        if (event.type === "wheel") return true;
        if (isNodeEventTarget(event.target)) return false;
        return !event.ctrlKey && event.button === 0;
      })
      .on("start", () => {
        setPreview(null);
      })
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);
    // Disable double-click zoom — we use dblclick to fit instead
    svg.on("dblclick.zoom", null);

    const hierarchyLinks = links.filter((l) => l.kind === "hierarchy");
    const crossLinkData = links.filter((l) => l.kind === "cross");

    const linkLayer = zoomGroup
      .append("g")
      .attr("class", "hierarchy-links")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1.5)
      .selectAll("line")
      .data(hierarchyLinks)
      .join("line");

    const crossLayer = zoomGroup
      .append("g")
      .attr("class", "cross-links")
      .attr("fill", "none")
      .attr("stroke", "var(--color-accent-2, #c62828)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-opacity", 0.75)
      .selectAll("line")
      .data(crossLinkData)
      .join("line");

    const nodeLayer = zoomGroup
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", styles.networkNode)
      .style("cursor", "pointer")
      .style("pointer-events", "all");

    const adjacency = new Map<string, Set<string>>();
    for (const link of links) {
      const sourceId =
        typeof link.source === "object"
          ? (link.source as SimNode).id
          : String(link.source);
      const targetId =
        typeof link.target === "object"
          ? (link.target as SimNode).id
          : String(link.target);
      if (!adjacency.has(sourceId)) adjacency.set(sourceId, new Set());
      if (!adjacency.has(targetId)) adjacency.set(targetId, new Set());
      adjacency.get(sourceId)!.add(targetId);
      adjacency.get(targetId)!.add(sourceId);
    }

    const clearFocus = () => {
      nodeLayer.classed(styles.nodeDimmed, false);
      nodeLayer.classed(styles.nodeFocused, false);
      linkLayer.classed(styles.linkDimmed, false);
      linkLayer.classed(styles.linkFocused, false);
      crossLayer.classed(styles.linkDimmed, false);
      crossLayer.classed(styles.linkFocused, false);
    };

    const focusNode = (id: string) => {
      const connected = adjacency.get(id) ?? new Set<string>();
      nodeLayer.classed(
        styles.nodeDimmed,
        (n) => n.id !== id && !connected.has(n.id),
      );
      nodeLayer.classed(styles.nodeFocused, (n) => n.id === id);
      const isTouching = (l: SimLink) => {
        const s =
          typeof l.source === "object"
            ? (l.source as SimNode).id
            : String(l.source);
        const t =
          typeof l.target === "object"
            ? (l.target as SimNode).id
            : String(l.target);
        return s === id || t === id;
      };
      linkLayer.classed(styles.linkDimmed, (l) => !isTouching(l));
      linkLayer.classed(styles.linkFocused, (l) => isTouching(l));
      crossLayer.classed(styles.linkDimmed, (l) => !isTouching(l));
      crossLayer.classed(styles.linkFocused, (l) => isTouching(l));
    };

    let isDragging = false;
    let suppressClick = false;

    const cancelHidePreview = () => {
      if (hidePreviewTimer.current) {
        clearTimeout(hidePreviewTimer.current);
        hidePreviewTimer.current = null;
      }
    };

    const hidePreview = () => {
      cancelHidePreview();
      hidePreviewTimer.current = setTimeout(() => setPreview(null), 60);
    };

    const showPreviewFor = (d: SimNode) => {
      if (isDragging || d.x == null || d.y == null) return;
      cancelHidePreview();
      const transform = d3.zoomTransform(svgEl);
      const scale = transform.k;
      const px = transform.applyX(d.x);
      const py = transform.applyY(d.y);
      const halfW = (cardWidth / 2) * scale;
      const halfH = (cardHeight / 2) * scale;
      const previewW = Math.min(288, width - 20);
      const previewH = 148;
      const gap = 12;

      let left = px + halfW + gap;
      if (left + previewW > width - 10) {
        left = px - halfW - gap - previewW;
      }
      left = clamp(left, 10, Math.max(10, width - previewW - 10));

      let top = py - previewH * 0.35;
      if (top + previewH > height - 10) top = height - previewH - 10;
      if (top < 10) top = 10;
      if (Math.abs(top + previewH / 2 - py) < halfH) {
        top = py + halfH + gap;
        if (top + previewH > height - 10) top = py - halfH - gap - previewH;
        top = clamp(top, 10, Math.max(10, height - previewH - 10));
      }

      setPreview({
        insight: d.insight,
        depth: d.depth,
        hasChildren: d.hasChildren,
        left,
        top,
      });
    };

    const onNodeActivate = (event: MouseEvent, d: SimNode) => {
      event.stopPropagation();
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      handleNodeNavigate(d.insight);
    };

    nodeLayer
      .append("foreignObject")
      .attr("class", styles.nodeForeign)
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("x", -cardWidth / 2)
      .attr("y", -cardHeight / 2)
      .style("overflow", "visible")
      .style("pointer-events", "none")
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .attr(
        "class",
        (d) =>
          `${styles.nodeCard}${d.depth === 0 ? ` ${styles.nodeCardRoot}` : ""}${
            d.hasChildren && d.depth > 0 ? ` ${styles.nodeCardBranch}` : ""
          }`,
      )
      .each(function (d) {
        const { text, fontSize, lengthClass, targetLines } = titleType(
          d.insight.title,
        );
        const card = d3.select(this);
        card
          .style("font-size", `${fontSize}px`)
          .style("font-weight", "600")
          .style("text-align", "left")
          .style("justify-content", "flex-start")
          .style("align-items", "center")
          .style("pointer-events", "none");
        card
          .append("xhtml:span")
          .attr("class", `${styles.nodeTitle} ${lengthClass}`)
          .style("display", "-webkit-box")
          .style("-webkit-box-orient", "vertical")
          .style("-webkit-line-clamp", String(targetLines))
          .style("overflow", "hidden")
          .style("text-align", "left")
          .style("font-weight", "600")
          .style("width", "100%")
          .style("pointer-events", "none")
          .text(text);
      });

    // Hit target on top of foreignObject so hover/click always work in SVG.
    nodeLayer
      .append("rect")
      .attr("class", styles.nodeHit)
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("x", -cardWidth / 2)
      .attr("y", -cardHeight / 2)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .style("cursor", "pointer");

    nodeLayer
      .on("click", (event, d) => onNodeActivate(event, d))
      .on("mouseenter", (_event, d) => {
        focusNode(d.id);
        showPreviewFor(d);
      })
      .on("mouseleave", () => {
        clearFocus();
        hidePreview();
      });

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) =>
            d.kind === "cross" ? linkDistance * 1.05 : linkDistance,
          )
          .strength((d) => (d.kind === "cross" ? 0.18 : 0.45)),
      )
      .force(
        "charge",
        d3
          .forceManyBody<SimNode>()
          .strength(chargeStrength)
          .distanceMin(collideRadius * 0.8)
          .distanceMax(Math.max(width, height) * 0.55),
      )
      .force(
        "collide",
        d3
          .forceCollide<SimNode>()
          .radius(collideRadius)
          .strength(0.95)
          .iterations(3),
      )
      .force("x", d3.forceX<SimNode>(width / 2).strength(0.045))
      .force("y", d3.forceY<SimNode>(height / 2).strength(0.055))
      .force("bounds", (alpha) => {
        const padX = cardWidth / 2 + 10;
        const padY = cardHeight / 2 + 10;
        const strength = 0.45 * alpha;
        for (const node of nodes) {
          if (node.x == null || node.y == null) continue;
          if (node.x < padX)
            node.vx = (node.vx ?? 0) + (padX - node.x) * strength;
          if (node.x > width - padX) {
            node.vx = (node.vx ?? 0) + (width - padX - node.x) * strength;
          }
          if (node.y < padY)
            node.vy = (node.vy ?? 0) + (padY - node.y) * strength;
          if (node.y > height - padY) {
            node.vy = (node.vy ?? 0) + (height - padY - node.y) * strength;
          }
        }
      })
      .alpha(1)
      .alphaDecay(0.022)
      .velocityDecay(0.38);

    const linkSource = (d: SimLink) => d.source as SimNode;
    const linkTarget = (d: SimLink) => d.target as SimNode;

    const fitToViewport = (animate: boolean) => {
      if (nodes.length === 0) return;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const node of nodes) {
        if (node.x == null || node.y == null) continue;
        minX = Math.min(minX, node.x - cardWidth / 2);
        minY = Math.min(minY, node.y - cardHeight / 2);
        maxX = Math.max(maxX, node.x + cardWidth / 2);
        maxY = Math.max(maxY, node.y + cardHeight / 2);
      }

      if (!Number.isFinite(minX) || !Number.isFinite(minY)) return;

      const boundsWidth = Math.max(maxX - minX, 1);
      const boundsHeight = Math.max(maxY - minY, 1);
      const pad = Math.max(16, Math.min(width, height) * 0.035);
      // Allow a light zoom-in so denser graphs fill the canvas
      const scale = clamp(
        Math.min(
          (width - pad * 2) / boundsWidth,
          (height - pad * 2) / boundsHeight,
        ),
        0.55,
        1.35,
      );
      const tx = width / 2 - scale * (minX + boundsWidth / 2);
      const ty = height / 2 - scale * (minY + boundsHeight / 2);
      const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

      if (animate) {
        svg
          .transition()
          .duration(450)
          .ease(d3.easeCubicOut)
          .call(zoomBehavior.transform, transform);
      } else {
        svg.call(zoomBehavior.transform, transform);
      }
    };

    const zoomBy = (factor: number) => {
      svg
        .transition()
        .duration(180)
        .ease(d3.easeCubicOut)
        .call(zoomBehavior.scaleBy, factor);
    };

    zoomApiRef.current = { zoomBy, fit: () => fitToViewport(true) };
    setCanZoom(true);

    svg.on("dblclick.fit", (event) => {
      event.preventDefault();
      fitToViewport(true);
    });

    let fitted = false;

    const applyPositions = () => {
      linkLayer
        .attr("x1", (d) => linkSource(d).x ?? 0)
        .attr("y1", (d) => linkSource(d).y ?? 0)
        .attr("x2", (d) => linkTarget(d).x ?? 0)
        .attr("y2", (d) => linkTarget(d).y ?? 0);

      crossLayer
        .attr("x1", (d) => linkSource(d).x ?? 0)
        .attr("y1", (d) => linkSource(d).y ?? 0)
        .attr("x2", (d) => linkTarget(d).x ?? 0)
        .attr("y2", (d) => linkTarget(d).y ?? 0);

      nodeLayer.attr(
        "transform",
        (d) => `translate(${d.x ?? 0},${d.y ?? 0})`,
      );
    };

    // Place nodes at seed positions immediately (before async ticks).
    applyPositions();

    // Warm-start so the first paint isn't a single stacked pile.
    for (let i = 0; i < 40; i += 1) simulation.tick();
    applyPositions();
    fitToViewport(false);
    fitted = true;

    simulation.on("tick", () => {
      applyPositions();
    });

    simulation.on("end", () => {
      fitToViewport(true);
    });

    const drag = d3
      .drag<SVGGElement, SimNode>()
      .clickDistance(8)
      .on("start", (event, d) => {
        suppressClick = false;
        if (!event.active) simulation.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        if (!isDragging) {
          isDragging = true;
          suppressClick = true;
          setPreview(null);
          clearFocus();
        }
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        const wasDragging = isDragging;
        isDragging = false;
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        if (wasDragging) {
          // Drop the synthetic click that follows a real drag.
          window.setTimeout(() => {
            suppressClick = false;
          }, 0);
        }
      });

    (
      nodeLayer as unknown as d3.Selection<
        SVGGElement,
        SimNode,
        SVGGElement,
        unknown
      >
    ).call(drag);

    return () => {
      simulation.stop();
      clearFocus();
      cancelHidePreview();
      setPreview(null);
      zoomApiRef.current = null;
      setCanZoom(false);
      svg.on(".zoom", null);
      svg.on("dblclick.fit", null);
    };
  }, [data, crossLinks, size, handleNodeNavigate]);

  const handleZoomIn = () => zoomApiRef.current?.zoomBy(1.28);
  const handleZoomOut = () => zoomApiRef.current?.zoomBy(1 / 1.28);
  const handleFit = () => zoomApiRef.current?.fit();

  const handleCanvasKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canZoom) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      handleZoomIn();
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      handleZoomOut();
    } else if (event.key === "0") {
      event.preventDefault();
      handleFit();
    }
  };

  return (
    <div className={styles.networkRoot}>
      <div className={styles.networkMeta}>
        <span>
          {data.length === 0
            ? "No insights yet"
            : `${totalNodeCount || data.length} node${
                (totalNodeCount || data.length) === 1 ? "" : "s"
              } in network`}
        </span>
        <span className={styles.networkHint}>
          Hover for details · click to open
        </span>
      </div>

      <div
        ref={containerRef}
        className={styles.networkCanvas}
        tabIndex={canZoom ? 0 : -1}
        onKeyDown={handleCanvasKeyDown}
        aria-label="Insights network canvas"
      >
        <svg
          ref={svgRef}
          className={styles.networkSvg}
          role="img"
          aria-label="Insights network"
        />

        {canZoom && (
          <div className={styles.zoomControls} role="group" aria-label="Zoom">
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M8 3.25v9.5M3.25 8h9.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M3.25 8h9.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.zoomBtn} ${styles.zoomBtnFit}`}
              onClick={handleFit}
              aria-label="Fit network to view"
              title="Fit to view"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}

        {preview && (
          <aside
            className={`${styles.nodePreview}${
              preview.depth === 0 ? ` ${styles.nodePreviewRoot}` : ""
            }`}
            style={{ left: preview.left, top: preview.top }}
            aria-hidden
          >
            <p className={styles.nodePreviewTitle}>
              {preview.insight.title || "Untitled insight"}
            </p>
            {preview.insight.description ? (
              <p className={styles.nodePreviewBody}>
                {preview.insight.description}
              </p>
            ) : (
              <p className={styles.nodePreviewBodyMuted}>No description yet</p>
            )}
            <div className={styles.nodePreviewMeta}>
              <span>
                {`${preview.insight.evidence?.length ?? 0} citation${
                  (preview.insight.evidence?.length ?? 0) === 1 ? "" : "s"
                }`}
              </span>
              <span>
                {`${preview.insight.children?.length ?? 0} child${
                  (preview.insight.children?.length ?? 0) === 1 ? "" : "ren"
                }`}
              </span>
              <span className={styles.nodePreviewHint}>Click to open</span>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default HybridRadialNetwork;
