"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { HierarchyPointNode } from "d3-hierarchy";
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

const HybridRadialNetwork: React.FC<HybridNetworkProps> = ({
  data,
  crossLinks,
  onNodeClick,
}) => {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalNodeCount, setTotalNodeCount] = useState(0);
  const [size, setSize] = useState({ width: 640, height: 360 });

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
      const width = Math.max(200, Math.floor(rect.width));
      const height = Math.max(160, Math.floor(rect.height));
      setSize({ width, height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      setTotalNodeCount(0);
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
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

    const rootData: Partial<Insight> & { uid: string; title: string } = {
      uid: "synthetic-root",
      title: "All My Insights",
      children: data
        .filter(
          (i) =>
            !i.parents ||
            i.parents.length === 0 ||
            !i.parents.some(
              (p) => p.parentInsight && insightMap.has(p.parentInsight.uid!),
            ),
        )
        .map((i) => ({
          childInsight: i,
          child_id: i.id!,
          parent_id: 0,
        })),
    };

    const getChildren = (d: Partial<Insight>) => {
      if (!d.children || d.children.length === 0) return null;
      return d.children
        .map((link: InsightLink) => {
          const fallbackUid = (link as unknown as Partial<Insight>).uid;
          const childObj = link.childInsight
            ? insightMap.get(link.childInsight.uid!) || link.childInsight
            : fallbackUid
              ? insightMap.get(fallbackUid) || (link as unknown as Insight)
              : undefined;
          return childObj;
        })
        .filter((i): i is Insight => !!i && !!i.title);
    };

    const width = size.width;
    const height = size.height;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    const zoomGroup = svg.append("g").attr("class", "zoom-container");

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 3])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const treeLayout = d3
      .tree<Partial<Insight>>()
      .size([2 * Math.PI, Math.max(80, radius - 90)])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    const root = treeLayout(d3.hierarchy(rootData, getChildren));

    const realNodesCount = root.descendants().filter((d) => d.parent).length;
    setTotalNodeCount(realNodesCount);

    const levelRadiusStep = Math.max(110, Math.min(180, radius * 0.42));
    root.each((d) => {
      d.y = d.depth * levelRadiusStep;
    });

    zoomGroup
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.28)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkRadial<
            d3.HierarchyLink<Partial<Insight>>,
            HierarchyPointNode<Partial<Insight>>
          >()
          .angle((d) => d.x)
          .radius((d) => d.y),
      );

    const isCompact = width < 520;
    const cardWidth = isCompact ? 112 : 148;
    const cardHeight = isCompact ? 52 : 64;

    const node = zoomGroup
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("class", "network-node")
      .style("cursor", (d) => (d.parent && d.data.uid ? "pointer" : "default"))
      .attr("transform", (d) => {
        if (!d.parent) return "translate(0,0)";
        const isRightHalf = d.x < Math.PI;
        const angle = (d.x * 180) / Math.PI - 90;
        return `rotate(${angle}) translate(${d.y},0) ${
          isRightHalf ? "" : "rotate(180)"
        }`;
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        if (!d.parent || !d.data.uid) return;
        handleNodeNavigate(d.data as Insight);
      });

    node
      .append("foreignObject")
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("x", (d) => {
        if (!d.parent) return -cardWidth / 2;
        return d.x < Math.PI ? 10 : -cardWidth - 10;
      })
      .attr("y", -cardHeight / 2)
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .style("width", "100%")
      .style("height", "100%")
      .style("box-sizing", "border-box")
      .style("background-color", (d) =>
        !d.parent
          ? "var(--color-accent, #c45c26)"
          : d.children
            ? "color-mix(in oklab, var(--color-accent, #c45c26) 78%, #1a1a1a)"
            : "var(--color-bg-elev, #fff)",
      )
      .style("color", (d) =>
        !d.parent || d.children
          ? "#fff"
          : "var(--color-text, #1a1a1a)",
      )
      .style("border", (d) =>
        !d.parent || d.children
          ? "0"
          : "1px solid var(--color-border, #ddd)",
      )
      .style("border-radius", "10px")
      .style("padding", isCompact ? "8px 10px" : "10px 12px")
      .style("font-size", isCompact ? "10px" : "11px")
      .style("font-weight", "600")
      .style("line-height", "1.3")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("text-align", "center")
      .style("word-break", "break-word")
      .style("overflow", "hidden")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.12)")
      .html((d) => d.data.title!);

    const nodeMap = new Map(
      root
        .descendants()
        .filter((d) => d.data.uid)
        .map((d) => [d.data.uid!, d]),
    );

    zoomGroup
      .append("g")
      .attr("stroke", "var(--color-accent-2, #c62828)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("fill", "none")
      .selectAll("path")
      .data(crossLinks)
      .join("path")
      .attr("d", (d) => {
        const source = nodeMap.get(d.sourceId);
        const target = nodeMap.get(d.targetId);
        if (!source || !target) return "";

        const x1 = source.y * Math.cos(source.x - Math.PI / 2);
        const y1 = source.y * Math.sin(source.x - Math.PI / 2);
        const x2 = target.y * Math.cos(target.x - Math.PI / 2);
        const y2 = target.y * Math.sin(target.x - Math.PI / 2);

        return `M${x1},${y1} Q 0,0 ${x2},${y2}`;
      });
  }, [data, crossLinks, size, handleNodeNavigate]);

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
        <span className={styles.networkHint}>Pinch or drag to explore</span>
      </div>

      <div ref={containerRef} className={styles.networkCanvas}>
        <svg ref={svgRef} className={styles.networkSvg} role="img" aria-label="Insights network" />
      </div>
    </div>
  );
};

export default HybridRadialNetwork;
