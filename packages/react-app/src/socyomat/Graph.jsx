import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export const Graph = ({ data, width, height, onUserClicked, onPostClicked }) => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (data && d3Container.current) {
      const svg = d3.select(d3Container.current);
      const tooltip = d3.select("#tooltip");
      svg.selectAll("*").remove(); // Clear SVG content before redrawing
      const defs = svg.append("defs");

      data.links.forEach((link, i) => {
        const gradient = defs
          .append("linearGradient")
          .attr("id", "gradient-" + i)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", link.source.x)
          .attr("y1", link.source.y)
          .attr("x2", link.target.x)
          .attr("y2", link.target.y);

        gradient.append("stop").attr("offset", "0%").attr("stop-color", link.source.color);

        gradient.append("stop").attr("offset", "100%").attr("stop-color", link.target.color);
      });

      // Set up your scales, forces, and SVG elements for the graph
      // Define the zoom behavior
      const zoom = d3
        .zoom()
        .scaleExtent([1 / 2, 8]) // Limit the scale
        .on("zoom", event => {
          g.attr("transform", event.transform);
        });
      // Create a group (g) to contain all the nodes and links
      const g = svg.append("g").attr("width", width).attr("height", height);
      // Apply the zoom behavior to the SVG element
      svg.call(zoom);

      // Create links (interactions)
      const links = svg
        .append("g")
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("path")
        .style("pointer-events", "auto") // Enable pointer events for nodes
        .attr("d", d => {
          const dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        })
        //.append("line")
        // .attr("stroke", (d, i) => "url(#gradient-" + i + ")")
        //.style("stroke-width", 2);
        .style("stroke", d => d.color)
        .style("stroke-width", d => d.thickness) // Example stroke width
        .style("fill", "none")
        .on("click", linkClicked) // Adding click event handler
        .on("mouseover", function (event, d) {
          tooltip.style("visibility", "visible").html("" + d.interactionType);
          console.log("mouse", d);
        })
        .on("mousemove", function (event) {
          tooltip.style("top", event.pageY - 10 + "px").style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        });

      // Create nodes (users)
      const nodes = svg
        .append("g")
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .style("pointer-events", "auto") // Enable pointer events for nodes
        .attr("r", 5) // radius of circle
        .attr("fill", d => d.color)
        .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
        .on("click", nodeClicked) // Adding click event handler
        .on("mouseover", function (event, d) {
          tooltip.style("visibility", "visible").html("" + d.type + ": " + d.id);
        })
        .on("mousemove", function (event) {
          tooltip.style("top", event.pageY - 10 + "px").style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        });

      // Define the force simulation
      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3.forceLink(data.links).id(d => d.id),
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2)); // assuming the SVG is 600x600

      // Update nodes and links positions on each tick
      simulation.on("tick", () => {
        // links
        //   .attr("x1", d => d.source.x)
        //   .attr("y1", d => d.source.y)
        //   .attr("x2", d => d.target.x)
        //   .attr("y2", d => d.target.y);

        links.attr("d", d => {
          const dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });
        nodes.attr("cx", d => d.x).attr("cy", d => d.y);

        // defs
        //   .selectAll("linearGradient")
        //   .attr("x1", d => d?.source?.x)
        //   .attr("y1", d => d?.source?.y)
        //   .attr("x2", d => d?.target?.x)
        //   .attr("y2", d => d?.target?.y);
      });

      function nodeClicked(event, d) {
        // Handle node click event
        console.log("Node clicked:", d);
        if (d.type === "user") {
          onUserClicked(d.id);
        } else if (d.type === "post") {
          onPostClicked(d.id);
        }
        // You can do something with the clicked node data 'd'
      }

      function linkClicked(event, d) {
        // Handle link click event
        console.log("Link clicked:", d);
        // You can do something with the clicked link data 'd'
      }
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }
  }, [data]);

  return (
    <div>
      <svg className="d3-component" width={width} height={height} ref={d3Container} />
      <div
        id="tooltip"
        style={{
          position: "absolute",
          visibility: "hidden",
          backgroundColor: "transparent",
          padding: "5px",
          border: "1px solid black",
        }}
      ></div>
    </div>
  );
};

export default Graph;
