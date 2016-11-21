/*
 * 	CSC-ORGANIZATION-CHART
 * 	ADogan
 * */
function D3OrganizationChart(id, data, config) {
    var tree;

    document.addEventListener("DOMContentLoaded", function(event) {
        dom = document.getElementById(id);
        render(dom);
    });

    render = function($container) {
        if (!data) {
            return;
        }
        data.x0 = 0;
        data.y0 = 0;

        selectedNode = undefined, selectedNodeData = undefined, detailedView = undefined,
            scrollScale = 0.7, detaildModeScale = 0.9, isDrawed = false,
            svgLeftCoor = 0, svgTopCoor = 0, svgRightCoor = 0, svgBottomCoor = 0,
            nodeWidth = 251, nodeHeight = 100, counter = 0, duration = 200;
        var selectionCounter = 0;
        w = parseInt(config.width) || 600;
        h = parseInt(config.height) || 350;

        tree = d3.layout.tree().nodeSize([nodeWidth, nodeHeight]);

        var $$svgContainer = $container;
        $$svgContainer.style.width = w + "px";

        svg = d3.select($$svgContainer).append("svg")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "container")
            .call(zm = d3.behavior.zoom().scaleExtent([0.4, 30]).on("zoom", function(d) {
                redraw(d);
            })).on("dblclick.zoom", null)
            .append("g")
            .attr("id", "gggg");

        var clientWidth = document.getElementsByTagName("svg")[0].clientWidth;

        update(data);
        
        if(config.onload){
            //setTimeout(function(){
                config.onload();
            //}, 1);
        }
    };

    setValue = function(value) {
        data = value;
        update();
    }

    getSelectedValue = function() {
        if (!selectedNodeData) {
            return;
        }
        return getClearData(selectedNodeData);
    }

    toggleSelectedNode = function(d) {
        if (!selectedNode) {
            return;
        }
        if (!d && selectedNodeData) {
            d = selectedNodeData;
        }
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        } else {
            return;
        }
        update(d);
    }

    collapse = function(data) {
        if (data.children) {
            data._children = data.children;
            data._children.forEach(function(d) {
                collapse(d);
            });
            data.children = null;
        }
    };

    expand = function(data) {
        if (data._children) {
            data.children = data._children;
            data.children.forEach(expand);
            data._children = null;
        }
    };

    expandNode = function(id, highlight, nodes) {
        if (!nodes) {
            nodes = [data];
        }

        if (nodes) {
            for (var i = 0; i < nodes.length; i++) {
                if ((nodes[i]).id && (nodes[i]).id == id) {
                    if (true) {
                        selectedNodeData = (nodes[i]);
                    }
                    // Atasına doğru açarak git.
                    var parent = (nodes[i]).parent;
                    var lastExpandedParent;
                    while (parent) {
                        if (!parent._children) {
                            parent = parent.parent;
                            continue;
                        }
                        parent.children = parent._children;
                        parent._children = null;
                        lastExpandedParent = parent;
                        parent = parent.parent;
                    }
                    if (!(nodes[i]).children) {
                        (nodes[i]).children = (nodes[i])._children;
                        (nodes[i])._children = null;
                    }

                    update(lastExpandedParent);
                    return;
                }

                var children = (nodes[i]).children || (nodes[i])._children;
                if (children) {
                    if (expandNode(id, highlight, children) === false) {
                        return;
                    }
                }
            }
        }
    }

    collapseNode = function(id, nodes) {
        if (!nodes) {
            nodes = [data];
        }

        if (nodes) {
            for (var i = 0; i < nodes.length; i++) {
                if ((nodes[i]).id && (nodes[i]).id == id) {
                    if ((nodes[i]).parent && !(nodes[i]).parent.children) {
                        return; // If it's not already there.
                    }
                    if (!(nodes[i])._children) {
                        (nodes[i])._children = (nodes[i]).children;
                        (nodes[i]).children = null;
                    }
                    (nodes[i])._children.forEach(function(data) {
                        collapse(data);
                    });

                    // Go open to the ancestor.
                    var parent = (nodes[i]).parent;
                    while (parent) {
                        if (!parent._children) {
                            parent = parent.parent;
                            continue;
                        }
                        parent.children = parent._children;
                        parent._children = null;
                        parent = parent.parent;
                    }
                    update(nodes[i]);
                    return;
                }

                var children = (nodes[i]).children || (nodes[i])._children;
                if (children) {
                    if (collapseNode(id, children) === false) {
                        return;
                    }
                }
            }
        }
    }

    // The tree fits in the container.
    reScaleCurrentTree = function() {
        isDrawed = false;
        update(data);
    }

    redraw = function(d) {
        scrollScale = d3.event.scale;
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + scrollScale + ")");

        if (config.detailOnZoom && !detailedView && scrollScale > detaildModeScale) {
            detailedView = true;
        } else if (detailedView && scrollScale < detaildModeScale) {
            detailedView = false;
        }
        update(undefined);
    }

    update = function(source) {
        if (!source) {
            source = data;
        }
        if (!tree) {
            return;
        }
        var nodes = tree.nodes(data),
            links = tree.links(nodes);

        // The y-axis ratio between nodes.
        nodes.forEach(function(d) {
            d.y = d.depth * 180;
        });

        svgLeftCoor = 0, svgRightCoor = 0, svgBottomCoor = 0;
        nodes.map(function(d) {
            svgLeftCoor = d.x < svgLeftCoor ? d.x : svgLeftCoor;
            svgRightCoor = d.x > svgRightCoor ? d.x : svgRightCoor;
            svgBottomCoor = d.y > svgBottomCoor ? d.y : svgBottomCoor;
        });

        if (!isDrawed) {
            scrollScale = (w / (svgRightCoor - svgLeftCoor + nodeWidth));
            if ((svgBottomCoor + nodeHeight) * scrollScale > h) {
                scrollScale = (h / (svgBottomCoor + nodeHeight));
            }
            svg.attr("transform", "translate(" + ((-1 * svgLeftCoor * scrollScale) + (w - (svgRightCoor - svgLeftCoor + nodeWidth) * scrollScale) / 2) + " " + (h - (svgBottomCoor + nodeHeight) * scrollScale) / 2 + ")" + "scale(" + scrollScale + ")");
            zm.scale(scrollScale);
            zm.translate([((-1 * svgLeftCoor * scrollScale) + (w - (svgRightCoor - svgLeftCoor + nodeWidth) * scrollScale) / 2), (h - (svgBottomCoor + nodeHeight) * scrollScale) / 2]);
            isDrawed = true;

            if (config.detailOnZoom && scrollScale > detaildModeScale) {
                detailedView = true;
            }
            if (scrollScale < 0.4) {
                zm.scaleExtent([scrollScale, 30]);
            }
        }

        var node = svg.selectAll(".node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++counter);
            });

        // Bring the parent node to the current position when the new node arrives.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.x0 + "," + source.y0 + ")";
            })
            .style("fill-opacity", 0)
            .style("stroke-opacity", 0)
            .on("dblclick", function(data) {
                doubleClickNode(data)
            })
            .on("click", function(data) {
                clickNode(data, this)
            })
            .on("contextmenu", function(data) {
                event.preventDefault();
                clickNode(data, this);
                if (config.onnoderightclicked) {
                    config.onnoderightclicked(getClearData(data));
                }
            });

        nodeEnter.append("rect")
            .attr("width", nodeWidth - 10)
            .attr("height", nodeHeight)
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("class", function(d) {
                return d._children ? "has-child" : "";
            });

        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return config.labelField ? d[config.labelField] : d.name;
            })
            .attr("class", "node-big-title")
            .style("fill-opacity", 0)
            .attr("transform", function(d) {
                return "translate(" + nodeWidth / 2 + "," + (nodeHeight + 10) / 2 + ")";
            });

        var detailedViewContainer = nodeEnter.append("g")
            .attr("class", "node-detail")
            .attr("opacity", 0);

        drawDetailView(detailedViewContainer);

        // Düğümü kendi pozisyonuna getir veya var olanı güncelle.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .style("fill-opacity", 1)
            .style("stroke-opacity", 1);

        nodeUpdate.select("rect")
            .attr("width", nodeWidth - 10)
            .attr("height", nodeHeight)
            .attr("class", function(d) {
                var newClass = d._children ? "has-child" : "";
                if (selectedNodeData == d) {
                    newClass += " selected-node";
                    selectedNode = d3.select(this);
                }
                return newClass;
            });

        nodeUpdate.select("text")
            .style("fill-opacity", function() {
                return detailedView ? 0 : 1;
            });

        nodeUpdate.select("g")
            .attr("opacity", function() {
                return detailedView ? 1 : 0;
            });

        // Düğümü kaldırırken parent pozisyonuna doğru götür.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.x + "," + source.y + ")";
            })
            .style("fill-opacity", 0)
            .style("stroke-opacity", 0)
            .remove();

        nodeExit.select("rect")
            .attr("width", nodeWidth - 10)
            .attr("height", nodeHeight);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        if (detailedView) {
            nodeExit.select("g")
                .attr("opacity", 0);
        }

        var link = svg.selectAll(".link")
            .data(links, function(d) {
                return d.target.id;
            });

        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", customDiagonal({
                source: {
                    x: source.x0,
                    y: source.y0
                },
                target: {
                    x: source.x0,
                    y: source.y0
                }
            }));

        link.transition()
            .duration(duration)
            .attr("d", customDiagonal());

        link.exit().transition()
            .duration(duration)
            .attr("d", customDiagonal({
                source: {
                    x: source.x,
                    y: source.y
                },
                target: {
                    x: source.x,
                    y: source.y
                }
            }))
            .remove();

        // Taşıma işlemi tamamlandıktan sonra eski pozisyonları temizle.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    getClearData = function(data) {
        var fieldList = getRealDataFields(data);
        var newData = {};
        for (var i = 0; i < fieldList.length; i++) {
            newData[fieldList[i]] = data[fieldList[i]];
        }
        return newData;
    }

    getRealDataFields = function(datas) {
        var fieldList = [];
        if (!Array.isArray(datas)) {
            datas = [datas];
        }
        for (var i = 0; i < datas.length; i++) {
            for (field in datas[i]) {
                if (field == "children" ||
                    field == "_children" ||
                    field == "depth" ||
                    field == "parent" ||
                    field == "x" ||
                    field == "y" ||
                    field == "x0" ||
                    field == "y0" ||
                    (config.imageField && field == config.imageField) ||
                    (config.showImageOnDetail && !config.imageField && field == "image")) {
                    continue;
                }
                if (fieldList.indexOf(field) === -1) {
                    fieldList.push(field);
                }
            }
        }
        return fieldList;
    }

    drawDetailView = function(container) {
        var fieldList = [];
        var s = 15;
        var p = 15;
        var datas = container.data();
        if (config.showImageOnDetail) {
            container
                .append("svg:image")
                .attr("xlink:href", function(d) {
                    return (config.imageField ? d[config.imageField] : d.image) || config.defaultImageUrl || "noimage.svg";
                })
                .attr("width", nodeHeight - 30)
                .attr("height", nodeHeight - 30)
                .attr("x", 10)
                .attr("y", 15);
        }

        fieldList = getRealDataFields(datas);

        for (var i = 0; i < fieldList.length; i++) {
            container.append("text")
                .text(function(d) {
                    return d[fieldList[i]]
                })
                .attr("class", "detail-text")
                .attr("x", config.showImageOnDetail ? nodeHeight : p)
                .attr("y", s);
            s += p;
        }
    }

    customDiagonal = function(dp) {
        var projection = function(d) {
            return [d.x, d.y];
        }

        var path = function(pathData) {
            return "M" + pathData[0] + ' ' + pathData[1] + ' ' + pathData[2] + ' ' + pathData[3];
        }

        function diagonal(diagonalPath, i) {
            if (dp) {
                diagonalPath = dp;
            }
            var source = diagonalPath.source,
                target = diagonalPath.target,
                midpointX = ((source.x + nodeWidth / 2) + (target.x + nodeWidth / 2)) / 2,
                midpointY = ((source.y + nodeHeight) + target.y) / 2,
                pathData = [{
                    x: source.x + nodeWidth / 2,
                    y: source.y + nodeHeight
                }, {
                    x: source.x + nodeWidth / 2,
                    y: midpointY
                }, {
                    x: target.x + nodeWidth / 2,
                    y: midpointY
                }, {
                    x: target.x + nodeWidth / 2,
                    y: target.y
                }];
            pathData = pathData.map(projection);
            return path(pathData);
        }

        diagonal.path = function(x) {
            if (!arguments.length) return path;
            path = x;
            return diagonal;
        };
        return diagonal;
    }

    clickNode = function(d, element) {
        highlightNode(element, d);
    }

    doubleClickNode = function(d) {
        toggleSelectedNode(d);
    }

    highlightNode = function(node, data) {
        var thiz = d3.select(node.getElementsByTagName("rect")[0]);

        if (!thiz.classed("selected-node")) {
            if (selectedNode) {
                selectedNode.classed("selected-node", false);
                selectedNode = undefined;
                selectedNodeData = undefined;
            }

            thiz.classed("selected-node", true);
            selectedNode = thiz;
            selectedNodeData = data;
        }
    }

    return {
        getSelectedValue: getSelectedValue,
        reScaleCurrentTree: reScaleCurrentTree,
        collapseNode: collapseNode,
        expandNode: expandNode,
        toggleSelectedNode: toggleSelectedNode
    };
};