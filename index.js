(function() {

var labelType, useGradients, nativeTextSupport, animate, cushion;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      isFF = !(!document.getBoxObjectFor && window.mozInnerScreenX == null),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
  cushion = !isFF;
})();

var json, histogram, debt, inflation, gdp, gdppc, gdpch, debtpc, debtgdp, debtch, population, 
    bc, yearbc, bcb, yearbcb, trendType, prop, wrapLegend, yr2yr,
    gdpChart, popChart, infChart, debtChart, backBar, heat, loading,
    debtCh, inflationCh, gdpCh, populationCh, currentGdp, currentDebt;

var year = 2011, 
    treeColors = ['#416D9C', '#70A35E', '#EBB056', '#C74243'],
    colors = treeColors.slice(),
    trans = {
      'amounti': 'Amount (USD)',
      'changeP': 'yr/yr Change',
      'budgetP': '% of Budget',
      'gdpP': '% GDP'
    };

window.init = function() {
  bc = $('bc');
  bcb = $('bcb');
  yearbc = $('yearbc');
  yearbcb = $('yearbcb');
  trendType = $('trend-type');
  backBar = $('back-bar');
  debt = $('debt');
  gdpch = $('gdp-change');
  debtch = $('debt-change');
  debtCh = $('debt');
  inflationCh = $('inflation');
  gdpCh = $('gdp');
  populationCh = $('population');
  heat = $('heat');
  wrapLegend = $('wrap-legend');
  yr2yr = $('yr2yr');
  loading = $('loading-panel').style;

  debtCh.addEventListener('change', function() {
    if (this.checked) {
      $('histogram-canvaswidget').appendChild($('area-canvas'));
    } else {
      $('area-canvaswidget').appendChild($('area-canvas'));
    }
  }, false);
  
  inflationCh.addEventListener('change', function() {
    if (this.checked) {
      $('histogram-canvaswidget').appendChild($('area2-canvas'));
    } else {
      $('area2-canvaswidget').appendChild($('area2-canvas'));
    }
  }, false);

  gdpCh.addEventListener('change', function() {
    if (this.checked) {
      $('histogram-canvaswidget').appendChild($('area3-canvas'));
    } else {
      $('area3-canvaswidget').appendChild($('area3-canvas'));
    }
  }, false);
  
  populationCh.addEventListener('change', function() {
    if (this.checked) {
      $('histogram-canvaswidget').appendChild($('area4-canvas'));
    } else {
      $('area4-canvaswidget').appendChild($('area4-canvas'));
    }
  }, false);

  backBar.addEventListener('click', function() {
    icicle.config.Events.onRightClick();
    return false;
  }, false);

  heat.addEventListener('change', function() {
    wrapLegend.style.display = this.checked? '' : 'none';
    if (!this.checked) {
      yr2yr.innerHTML = '';
      icicle.graph.nodeList.removeData('diffBorder');
      icicle.plot();
    }
    return false;
  }, false);

  new IO.XHR({
    url: 'indicators/indicators.json',
    onSuccess: function(jsonString) {
      var ind = JSON.parse(jsonString);
      gdp = ind['gdp'];
      inflation = ind['inflation'];
      population = ind['population'];
      debt = ind['debt'];
      debtpc = ind['debtpc'];
      debtgdp = ind['debtgdp'];
      gdppc = ind['gdppc'];
      initArea();
    }
  }).send();
  
  new IO.XHR({
    url: 'trees/' + year + '.json',
    onSuccess: function(jsonString) {
      json = JSON.parse(jsonString);
      new IO.XHR({
        url: 'aggregates/group._total.json',
        onSuccess: function(jsonString) {
          histogram = JSON.parse(jsonString);
          initIcicle();
          initHistogram();
        }
      }).send();
    }
  }).send();
}

function createDetails(node) {
  if (!node) return;
  var path = [node.name], 
      cur = node.getParents()[0];
  while(cur) {
    path.push(cur.name);
    cur = cur.getParents()[0];
  }
  bcb.innerHTML = path[0].length > 30? path[0].substr(0, path[0].length / 2) + '... ' : path[0];
  path.reverse();
  bc.innerHTML = path.join(' > ');
}

function normalizeValue(n, prec, delim) {
  if (n == 0) {
    return '0';
  }
  prec = prec || 2;
  prec = Math.pow(10, prec);
  var hasDelim = arguments.length == 3;
  if (n >= 1e9) {
    return (((n / (1e9 / prec)) >> 0) / prec) + (hasDelim? delim : 'B');
  } else if (n >= 1e6) {
    return (((n / (1e6 / prec)) >> 0) / prec) + (hasDelim? delim: 'M');
  } else if (n >= 1e3) {
    return (((n / (1e3 / prec)) >> 0) / prec) + (hasDelim? delim: 'K');
  } else {
    return (((n * prec) >> 0) / prec) + (hasDelim? delim: '%');
  }
}

function initArea() {
  var opt = {
    //id of the visualization container
    injectInto: 'area',
    width: 1000,
    height: 130,
    //separation offsets
    Margin: {
      top: 0,
      left: 20,
      right: 92,
      bottom: 0
    },
    labelOffset: 10,
    //whether to display sums
    showAggregates: false,
    //whether to display labels at all
    showLabels: false,
    //could also be 'stacked'
    type: 'stacked:gradient',
    //label styling
    Label: {
      type: 'Native',
      size: 13,
      family: 'Arial',
      color: 'white'
    },
  };
  
  debtChart = new $jit.AreaChart(opt);
  debt.color = ["#C74243"];
  debtChart.loadJSON(debt);

  opt.injectInto = 'area2';
  infChart = new $jit.AreaChart(opt);
  inflation.color = ["#83548B"];
  infChart.loadJSON(inflation);

  opt.injectInto = 'area3';
  gdpChart = new $jit.AreaChart(opt);
  gdp.color = ["#222"];
  gdpChart.loadJSON(gdp);

  opt.injectInto = 'area4';
  popChart = new $jit.AreaChart(opt);
  population.color = ["#9fd4ff"];
  popChart.loadJSON(population);
}

function initHistogram() {
  //init BarChart
  barChart = new $jit.BarChart({
    //id of the visualization container
    injectInto: 'histogram',
    //whether to add animations
    animate: true,
    //horizontal or vertical barcharts
    orientation: 'vertical',
    //bars separation
    barsOffset: 2,
    hoveredColor: '#33dddd',
    //visualization offset
    Margin: {
      top: 0,
      left: 5,
      right: 5,
      bottom: 0
    },
    //labels offset position
    labelOffset: 5,
    //bars style
    type: 'stacked',
    //whether to show the aggregation of the values
    showAggregates: !window.opera && function(name, value, node) {
      var perc = prop == 'gdpP',
          nValue = perc? normalizeValue(value * 10, 5, '') : normalizeValue(value, 5);

      if (nValue.indexOf('%') > -1) {
        nValue = nValue.replace('%', '');
      }
      
      var match = nValue.match(/^([0-9]+)\.([0-9]+)(.*)$/),
          matchInt = nValue.match(/^([0-9]+)(.*)$/),
          n = 3, zeros = '000', stringValue;
      

      if (match) {
        if (n > match[1].length) {
          if (+match[1] == 0) {
            stringValue = '.' + match[2].substr(0, n - match[1].length + perc && 4 || 1);
          } else {
            stringValue = match[1] + '.' + match[2].substr(0, n - match[1].length) + match[3];
          }
        } else {
          stringValue = match[1] + match[3];
        }
      } else {
        if (n > matchInt[1].length) {
          if (+matchInt[1] == 0) {
            stringValue = '.' + zeros.substr(0, n - matchInt[1].length + perc && 4 || 1);
          } else {
            stringValue = matchInt[1] + '.' + zeros.substr(0, n - matchInt[1].length) + matchInt[2];
          }
        } else {
          stringValue = matchInt[1] + matchInt[2];
        }
      }
      
      return stringValue;
    },
    //whether to show the labels for the bars
    showLabels: true,
    //labels style
    Label: {
      type: labelType, //Native or HTML
      size: 12,
      family: 'Crimson Text',
      color: '#000'
    },
    Events: {
      enable: true,
      onClick: function(bar) {
        if (!bar) return;
        if (heat.checked) {
          yr2yr.innerHTML = year + ' - ' +bar.label;
        }
        year = +bar.label;
        yearbc.innerHTML = yearbcb.innerHTML = year;
        loading.display = 'block';
        //morph the icicle
        new IO.XHR({
          url: 'trees/' + year + '.json',
          onSuccess: function(jsonString) {
            json = JSON.parse(jsonString);
            loading.display = 'none';
            if (!heat.checked) {
              icicle.op.morph(json, {
                type: 'fade:con',
                duration: 1000
              }, {
                position: 'linear',
                'node-property': ['width', 'height']
              });
              return;
            }
            
            var subJson = icicle.clickedNode && $jit.json.getSubtree(json, icicle.clickedNode.id) || json,
                dimJson = subJson.data.$dim,
                graph = icicle.graph,
                subGraph = icicle.clickedNode || graph.getNode(json.id),
                dimGraph = subGraph.data.$dim;

            $jit.json.each(subJson, function(n) {
              delete n.data.$color;
              var node = graph.getNode(n.id);
              if (node) {
                //var delta = n.data.$dim * (dimGraph / dimJson) - node.data.$dim;
                var delta = n.data.$dim - node.data.$dim;
                if (delta < 0) {
                  node.setData('color', '#f00', 'end');
                  node.setData('diffBorder', '#f00');
                } else if (delta > 0) {
                  node.setData('color', '#0f0', 'end');
                  node.setData('diffBorder', '#0f0');
                } else {
                  node.setData('color', '#ccc', 'end');
                  node.removeData('diffBorder');
                }
              } else {
                n.data.$color = '#0f0';
                n.data.$diffBorder = '#0f0';
              }
            });

            icicle.fx.animate({
              modes: {
                'node-property': 'color'
              },
              duration: 400,
              onComplete: function() {
                  icicle.op.morph(json, {
                    type: 'fade:con',
                    duration: 1000,
                    onComplete: function() {
                      graph.eachNode(function(n) {
                        n.setData('color', treeColors[n._depth], 'end');
                      });
                      icicle.fx.animate({
                        modes: {
                          'node-property': 'color'
                        },
                        duration: 1000
                      });
                    }
                  }, {
                      'position': 'linear',
                      'node-property': ['width', 'height']
                  });
              }
            });

          }
        }).send();
        //select the bar
        selectBar(); 

      }
    },
    //add tooltips
    Tips: {
      enable: true,
      offsetX: 30,
      offsetY: -10,
      onShow: function(tip, elem) {
        tip.style.visibility = 'visible';
        var html = [];

        html.push((elem.name == '_total'? '<b>Total budget</b>' : '<b>' + elem.name + '</b>') 
          + ': ' + normalizeValue(elem.value));

        if (debtCh.checked && debt.values[+elem.label - 1985]) {
          html.push('<b>Debt: </b>' + normalizeValue((currentDebt || debt).values[+elem.label - 1985].values));
        }

        if (gdpCh.checked && gdp.values[+elem.label - 1985]) {
          html.push('<b>GDP: </b>' + normalizeValue((currentGdp || gdp).values[+elem.label - 1985].values));
        }

        if (inflationCh.checked && inflation.values[+elem.label - 1985]) {
          html.push('<b>Inflation: </b>' + normalizeValue(inflation.values[+elem.label - 1985].values));
        }
        
        if (populationCh.checked && population.values[+elem.label - 1985]) {
          html.push('<b>Population Change: </b>' + normalizeValue(population.values[+elem.label - 1985].values));
        }

        tip.innerHTML ="<div class=\"tip-title\">" + elem.label
            + "</div><div class=\"tip-text\"><ul><li>"
            + html.join('</li><li>')
            + '</li></ul></div>';
      }
    }
  });
  //load JSON data.
  barChart.loadJSON(histogram);
  selectBar();
  yearbc.innerHTML = yearbcb.innerHTML = year;
  
  trendType.addEventListener('change', function() {
    prop = ['amounti', 'perCapitaI', 'gdpP'][trendType.selectedIndex];
    histogram.values.forEach(function(h) {
      h.values = h[prop];
    });
    barChart.updateJSON(histogram);
    switch (trendType.selectedIndex) {
      case 0:
        currentGdp = gdp;
        currentDebt = debt;
        gdpChart.updateJSON(gdp);
        debtChart.updateJSON(debt);
        gdpch.innerHTML = debtch.innerHTML = 'USD';
        break;
      case 1:
        currentGdp = gdppc;
        currentDebt = debtpc;
        gdpChart.updateJSON(gdppc);
        debtChart.updateJSON(debtpc);
        gdpch.innerHTML = debtch.innerHTML = 'USD per capita';
        break;
      case 2:
        currentGdp = gdp;
        currentDebt = debtgdp;
        gdpChart.updateJSON(gdp);
        debtChart.updateJSON(debtgdp);
        gdpch.innerHTML = 'USD';
        debtch.innerHTML = '&#8240; of GDP';
        break;
    }
  }, false);

}

function updateHistogram(jsonString, node) {
  if (jsonString) {
    histogram = JSON.parse(jsonString);
  }
  if (prop) {
    histogram.values.forEach(function(h) {
      h.values = h[prop];
    });
  }
  barChart.updateJSON(histogram);
  selectBar();
  barChart.st.graph.nodeList.setData('colorArray', [colors[node._depth]]);
}

function selectBar() {
 var st = barChart.st,
          graph = st.graph;
  
  if (window.opera) {
    graph.eachNode(function(n) {
      if (n.name == String(year)) {
        n.setData('alpha', 1);
      } else {
        n.setData('alpha', 0.8);
      }
    }); 
  } else {
    graph.eachNode(function(n) {
      if (n.name == String(year)) {
        n.setData('selected', true);
      } else {
        n.setData('selected', false);
      }
    });
  }
  st.plot();
}

function initIcicle(){
  $jit.Icicle.Plot.NodeTypes.implement({

    'uber-rectangle': {
      'render': function(node, canvas, animating) {
        var config = this.viz.config;
        var offset = config.offset;
        var width = node.getData('width');
        var height = node.getData('height');
        var border = node.getData('border');
        var diffBorder = node.getData('diffBorder');
        var pos = node.pos.getc(true);
        var posx = pos.x + offset / 2, posy = pos.y + offset / 2;
        var ctx = canvas.getCtx();
        
        ctx.strokeStyle = node.getData('color');
        
        if(width - offset < 0 || height - offset < 0) return;

        ctx.fillRect(posx, posy, 3 * Math.max(0, width - offset) / 4, Math.max(0, height - offset));
        ctx.lineWidth = 2;
        ctx.strokeRect(posx, posy + 2, 3 * Math.max(0, width - offset) / 4, Math.max(0, height - offset - 4));

        if (diffBorder && heat.checked) {
          ctx.strokeStyle = ctx.fillStyle = diffBorder;
          ctx.lineWidth = 3;
          ctx.fillRect(posx + 3 * Math.max(0, width - offset) / 4 - 3, posy, 4,  Math.max(0, height - offset));
        }
        
        if(node._depth == 3 || width - offset < 0 || height - offset < 0) return;
        
        border && ctx.clearRect(posx + 3 * width / 4, posy, width / 4 - 1, height - offset);
        var totalDim = 0;
        node.eachSubnode(function(n) {
          if (totalDim > height) return;
          ctx.fillStyle = ctx.strokeStyle = n.getData('color');
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(posx + 3 * (width) / 4, posy + (height - offset) / 2);
          ctx.lineTo(posx + width, posy + totalDim);
          ctx.lineTo(posx + width, posy + totalDim + Math.max(0, n.getData('height') - offset));
          ctx.lineTo(posx + 3 * (width) / 4, posy + (height - offset) / 2);
          ctx.fill();
          totalDim += Math.max(0, n.getData('height'));
        });

        if (border) {
          ctx.strokeStyle = border;
          ctx.lineWidth = 2;
          ctx.strokeRect(pos.x, pos.y, 3 * width / 4, height);
        }
      },

      'contains': function(node, pos) {
        if(this.viz.clickedNode && !$jit.Graph.Util.isDescendantOf(node, this.viz.clickedNode.id)) return false;
        var npos = node.pos.getc(true),
            width = node.getData('width'),
            height = node.getData('height');
        return this.nodeHelper.rectangle.contains({x: npos.x + width/2, y: npos.y + height/2}, pos, width, height);
      }
    }
    
  });
  
  
  // init Icicle
  // remove loading panel
  var det = $('loading');
  det.parentNode.removeChild(det);

  icicle = new $jit.Icicle({
    // id of the visualization container
    injectInto: 'icicle',
    // whether to add transition animations
    animate: animate,
    // nodes offset
    offset: 0.5,
    // whether to add cushion type nodes
    cushion: true,//cushion,
    
    constrained: true,
    levelsToShow: 3,

    Node: {
      type: 'uber-rectangle'
    },

    // enable tips
    Tips: {
      enable: true,
      type: 'Native',
      // add positioning offsets
      offsetX: 20,
      offsetY: 20,
      // implement the onShow method to
      // add content to the tooltip when a node
      // is hovered
      onShow: function(tip, node){
        if (!node || !node.getParents().length) {
          tip.style.visibility = 'hidden';
          return;
        }
        tip.style.visibility = 'visible';

        var data = node.data, list = [];
        for (var prop in data) {
          if (prop != 'gdpP' && prop[0] != '$') {
            if (prop == 'changeP') {
              list.push('<b>' + trans[prop] + ': </b>' + (data[prop] > 0? '+' : '') + normalizeValue(data[prop]));
            } else {
              list.push('<b>' + trans[prop] + ': </b>' + normalizeValue(data[prop]));
            }
          }
        } 

        // add tooltip info
        tip.innerHTML = "<div class=\"tip-title\">" + node.name
            + "</div><div class=\"tip-text\"><ul><li>"
            + list.join('</li><li>')
            + '</li></ul></div>';
      }    
    },
    // Add events to nodes
    Events: {
      enable: true,
      onMouseEnter: function(node) {
        //add border and replot node
        node.setData('border', '#33dddd');
        icicle.fx.plotNode(node, icicle.canvas);
        icicle.labels.plotLabel(icicle.canvas, node, icicle.controller);
      },
      onMouseLeave: function(node) {
        node.removeData('border');
        icicle.fx.plot();
      },
      onClick: function(node){
        //hide tips and selections
        icicle.tips.hide();
        if (!node || node._depth == 3) return;
        if (node) {
         if(!icicle.busy) {
            backBar.className = 'level' + node._depth;
          }
          createDetails(node);
          if(icicle.events.hovered)
            this.onMouseLeave(icicle.events.hovered);
          icicle.enter(node);
          //load the right histogram
          var url;
          if (node._depth) {
            url = 'aggregates/' + (node._depth == 1? 'group.' : 'subgroup.') + encodeURIComponent(node.name) + '.json';
          } else {
            url = 'aggregates/group._total.json';
          }
          new IO.XHR({
            url: url,
            onSuccess: function(jsonString) {
              updateHistogram(jsonString, node);
            }
          }).send();
        }
      },
      onRightClick: function(){
        //hide tips and selections
        icicle.tips.hide();
        if(icicle.events.hovered)
          this.onMouseLeave(icicle.events.hovered);
        if(icicle.clickedNode) {
          if(!icicle.busy) {
            backBar.className = 'level' + Math.max(icicle.clickedNode._depth -1, 0);
          }
        }
        //perform the out animation
        var parentNode = icicle.clickedNode && icicle.clickedNode.getParents()[0];
        createDetails(parentNode);
        if (parentNode) {
          //load the right histogram
          var url;
          if (parentNode._depth) {
            url = 'aggregates/' + (parentNode._depth == 1? 'group.' : 'subgroup.') 
              + encodeURIComponent(parentNode.name) + '.json';
          } else {
            url = 'aggregates/group._total.json';
          }
          new IO.XHR({
            url: url,
            onSuccess: function(jsonString) {
              updateHistogram(jsonString, parentNode);
            }
          }).send();
        }
        icicle.out();
      }
    },
    // Add canvas label styling
    Label: {
      type: labelType, // "Native" or "HTML"
      size: 15,
      family: 'Crimson Text'
    },
    // Add the name of the node in the corresponding label
    // This method is called once, on label creation and only for DOM and not
    // Native labels.
    onCreateLabel: function(domElement, node){
      domElement.innerHTML = node.name;
      var style = domElement.style;
      style.fontSize = '0.9em';
      style.display = '';
      style.cursor = 'pointer';
      style.overflow = 'hidden';
    },
    // Change some label dom properties.
    // This method is called each time a label is plotted.
    onPlaceLabel: function(domElement, node){
      var style = domElement.style,
          width = node.getData('width'),
          height = node.getData('height');
      if(width < 2 || height < 2) {
        style.display = 'none';
      } else {
        style.display = '';
        style.width = width + 'px';
        style.height = height + 'px';
        style.fontSize = Math.min(Math.max(5, (height / 2) >> 0), 40) + 'px';
      }
    }
  });
  icicle.reposition = function() { icicle.compute('end'); };
  // load data
  icicle.loadJSON(json);
  // compute positions and plot
  ['current', 'start', 'end'].forEach(function(n) {
    icicle.compute(n);
  });
  icicle.plot();
  //end
}

})();
