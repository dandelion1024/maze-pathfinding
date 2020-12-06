var mapArea = document.getElementById('map_area');
var nodeTypeChangeable = true;
var isRunning = false;

// 1 表示障碍，0 表示路，2表示起点，3表示终点
var map = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 2, 1, 3, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

var mapNodes = [];

// ********** 节点类型定义 ***********
var NodeType = {
    REACHABLE: 0, // 可达区域
    OBSTACLE: 1, // 障碍物
    START: 2, // 起点
    FINISH: 3, // 终点
    OPEN: 4, // openList中的的节点
    CLOSE: 5, // clostList中的的节点
    PATH: 6, // 当前探测路径上的节点
    CURRENT: 7
};

NodeType.length = Object.keys(NodeType).length;

// **********************************

// ********** 节点颜色定义 ***********
// openList中的点为绿色，closeList中的点为红色
// 当前探测的路径中的节点为蓝色
// 起点为黄色，终点为紫色，其他可达区域为白色
// 不可通过区域为黑色
var NodeColor = {
    REACHABLE: '#FFFFFF', // 可达区域
    OBSTACLE: '#003300', // 障碍物
    START: '#FF9900', // 起点
    FINISH: '#CC00FF', // 终点
    OPEN: '#006633', // openList中的的节点
    CLOSE: '#FF3300', // clostList中的的节点
    PATH: '#3399FF', // 当前探测路径上的节点
    CURRENT: '#6666FF'
};

// **********************************

var NODE_WIDTH = 60;
var NODE_HEIGHT = 60;

var mapHeight = map.length;
var mapWidth = map[0].length;

class MapNode {
    constructor(x, y) {
        this.x = parseInt(x);
        this.y = parseInt(y);
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
    }
}

MapNode.prototype.equals = function (obj) {
    if (!typeof obj == "MapNode") {
        return false;
    }

    return this.x === obj.x && this.y === obj.y;
};

MapNode.prototype.toString = function () {
    var str = '[' + this.x + ', ' + this.y + '](' + this.f + ')';

    if (this.parent != null) {
        str += ' ——> ' + '[' + this.parent.x + ', ' + this.parent.y + ']';
    } else {
        str += ' ——> ' + '[null]';
    }

    return str;
};

var openList = [];
var closeList = [];

var startNode = new MapNode(0, 0);
var finishNode = new MapNode(0, 0);

function initData() {
    var startExist = false;
    var finishExist = false;

    // 寻找起点和终点
    for (let i = 0; i < map.length; ++i) {
        for (let j = 0; j < map[i].length; ++j) {
            if (map[i][j] == 2) {
                startNode.y = i;
                startNode.x = j;
                startExist = true;
            } else if (map[i][j] == 3) {
                finishNode.y = i;
                finishNode.x = j;
                finishExist = true;
            }
        }
    }

    if (!startExist) {
        alert('地图没有起点');
        return false;
    }

    if (!finishExist) {
        alert('地图没有终点');
        return false;
    }

    startNode.g = 0;
    geth(startNode);
    startNode.f = startNode.g + startNode.h;

    return true;
}

function checkSonNode(sonNode, curNode) {
    // 跳过节点本身和障碍物
    if (sonNode.equals(curNode) || isObstacle(sonNode)) {
        return;
    }

    // 计算出子节点的对应属性
    sonNode.g = curNode.g + 1 * 10;
    sonNode.f = sonNode.g + geth(sonNode);
    sonNode.parent = curNode;

    var pos = inCloseList(sonNode);

    // 如果在 closeList 中就跳过
    if (pos >= 0) {
        return;
    }

    pos = inOpenList(sonNode);

    if (pos >= 0) {
        if (sonNode.f < openList[pos].f) {
            openList[pos] = sonNode;
            console.log('更新了一个节点，新值=' + openList[pos].toString());
        }
        return;
    }

    openList.push(sonNode);
    drawNode(sonNode, NodeType.OPEN);
    console.log('添加了一个节点，值=' + sonNode.toString());
}

function findPath() {
    if (isRunning) {
        alert('算法已运行，请先重置状态');
        return;
    }

    isRunning = true;

    drawNode(startNode, NodeType.START);
    openList.push(startNode);

    while (openList.length != 0) {
        let curIndex = getMinNodeIndex();
        let curNode = openList[curIndex];

        // 从 openList 中删除当前元素，并添加到 closeList 中
        openList.splice(curIndex, 1);
        closeList.push(curNode);

        if (!curNode.equals(startNode)) {
            drawNode(curNode, NodeType.CLOSE);
        }

        // 到目标节点了就结束
        if (curNode.equals(finishNode)) {
            alert('A* 寻路完成，共搜索了 ' + closeList.length + ' 个节点');
            finishNode = curNode;
            break;
        }

        var i, j;

        for (i = curNode.x - 1, j = curNode.y; i <= curNode.x + 1; ++i) {
            if (i < 0 || i >= map[0].length) {
                continue;
            }

            let sonNode = new MapNode(i, j);

            checkSonNode(sonNode, curNode);
        }

        for (j = curNode.y - 1, i = curNode.x; j <= curNode.y + 1; ++j) {
            if (j < 0 || j >= map.length) {
                continue;
            }

            let sonNode = new MapNode(i, j);

            checkSonNode(sonNode, curNode);
        }

        sortOpenList();
    }

    outputPath();

    nodeTypeChangeable = false;
}


var lastNode;

function step() {
    if (!isRunning) {
        drawNode(startNode, NodeType.START);
        openList.push(startNode);
        isRunning = true;
        lastNode = startNode;
    }

    if (openList.length != 0) {
        let curIndex = getMinNodeIndex();
        let curNode = openList[curIndex];

        if (!curNode.equals(startNode)) {
            drawNode(curNode, NodeType.CURRENT);

            if (!lastNode.equals(startNode)) {
                drawNode(lastNode, NodeType.CLOSE);
            }

            lastNode = curNode;
        }

        // 从 openList 中删除当前元素，并添加到 closeList 中
        openList.splice(curIndex, 1);
        closeList.push(curNode);

        // 到目标节点了就结束
        if (curNode.equals(finishNode)) {
            finishNode = curNode;
            nodeTypeChangeable = false;
            alert('A* 寻路完成，共搜索了 ' + closeList.length + ' 个节点');
            outputPath();
            return;
        }

        var i, j;

        for (i = curNode.x - 1, j = curNode.y; i <= curNode.x + 1; ++i) {
            if (i < 0 || i >= map[0].length) {
                continue;
            }

            let sonNode = new MapNode(i, j);

            checkSonNode(sonNode, curNode);
        }


        for (j = curNode.y - 1, i = curNode.x; j <= curNode.y + 1; ++j) {
            if (j < 0 || j >= map.length) {
                continue;
            }

            let sonNode = new MapNode(i, j);

            checkSonNode(sonNode, curNode);
        }

        sortOpenList();
    } else {
        nodeTypeChangeable = false;
        alert('未找到路径');
    }

}

// 在 openList 中找 f 最小的元素的下标
function getMinNodeIndex() {
    if (openList.length == 0) {
        console.log('查找最小f的节点失败：openList为空');
        return -1;
    }

    var minIndex = 0;

    for (let i = 0; i < openList.length; ++i) {
        if (openList[i].f < openList[minIndex].f) {
            minIndex = i;
        }
    }

    return minIndex;
}

function geth(node) {
    node.h = 10 * (Math.abs(finishNode.x - node.x) + Math.abs(finishNode.y - node.y));
    return node.h;
}

function isObstacle(node) {
    return map[node.y][node.x] == 1;
}

function inOpenList(node) {
    for (let i = 0; i < openList.length; ++i) {
        if (node.equals(openList[i])) {
            return i;
        }
    }

    return -1;
}

function inCloseList(node) {
    for (let i = 0; i < closeList.length; ++i) {
        if (node.equals(closeList[i])) {
            return i;
        }
    }

    return -1;
}


function sortOpenList() {
    var i, j;

    for (i = 0; i < openList.length; ++i) {
        for (j = 0; j < openList.length - i - 1; ++j) {
            if (openList[j].f > openList[j + 1].f) {
                swapNode(openList[j], openList[j + 1]);
            }
        }
    }
}

function outputPath() {
    var curNode = finishNode;
    var cnt = 0;
    while (curNode != null) {
        console.log('(' + curNode.x + ', ' + curNode.y + ')');
        drawNode(curNode, NodeType.PATH);
        ++cnt;
        curNode = curNode.parent;
    }

    alert('路径长度为: ' + cnt);
}

function outputOpen() {
    console.log('-------- Node in openList --------');

    for (let i = 0; i < openList.length; ++i) {
        console.log(openList[i].toString());
    }

    console.log('----------------------------------');
}

function clearMapArea() {
    var childs = mapArea.childNodes;
    var len = childs.length;

    for (let i = len - 1 - 4; i >= 0; --i) {
        mapArea.removeChild(childs[i]);
    }
}

function initMap() {
    clearMapArea();

    mapArea.style.width = mapWidth * NODE_WIDTH + 'px';
    mapArea.style.height = mapHeight * NODE_HEIGHT + 'px';

    mapNodes = new Array(mapHeight);

    var i, j;
    var tmpNode;

    for (i = 0; i < mapHeight; ++i) {
        mapNodes[i] = new Array(mapWidth);
        for (j = 0; j < mapWidth; ++j) {
            tmpNode = createNodeDiv();
            tmpNode.style.width = NODE_WIDTH + 'px';
            tmpNode.style.height = NODE_HEIGHT + 'px';
            tmpNode.style.top = i * NODE_HEIGHT + 'px';
            tmpNode.style.left = j * NODE_WIDTH + 'px';
            mapNodes[i][j] = tmpNode;

            mapNodes[i][j].setAttribute('x', j);
            mapNodes[i][j].setAttribute('y', i);

            mapArea.appendChild(mapNodes[i][j]);

            switch (map[i][j]) {
                case 0:
                    drawNodeColor(j, i, NodeType.REACHABLE);
                    break;
                case 1:
                    drawNodeColor(j, i, NodeType.OBSTACLE);
                    break;
                case 2:
                    drawNodeColor(j, i, NodeType.START);
                    break;
                case 3:
                    drawNodeColor(j, i, NodeType.FINISH);
                    break;
            }
        }
    }
}

function drawNode(node, type) {
    var nodeDiv = mapNodes[node.y][node.x];
    var gdiv = nodeDiv.getElementsByClassName('g')[0];
    var hdiv = nodeDiv.getElementsByClassName('h')[0];
    var fdiv = nodeDiv.getElementsByClassName('f')[0];

    gdiv.innerHTML = node.g;
    hdiv.innerHTML = node.h;
    fdiv.innerHTML = node.f;

    switch (type) {
        case NodeType.REACHABLE:
            nodeDiv.style.background = NodeColor.REACHABLE;

            break;
        case NodeType.OBSTACLE:
            nodeDiv.style.background = NodeColor.OBSTACLE;

            break;
        case NodeType.START:
            nodeDiv.style.background = NodeColor.START;

            break;
        case NodeType.FINISH:
            nodeDiv.style.background = NodeColor.FINISH;

            break;
        case NodeType.OPEN:
            nodeDiv.style.background = NodeColor.OPEN;
            break;
        case NodeType.CLOSE:
            nodeDiv.style.background = NodeColor.CLOSE;
            break;
        case NodeType.PATH:
            nodeDiv.style.background = NodeColor.PATH;
            break;
        case NodeType.CURRENT:
            nodeDiv.style.background = NodeColor.CURRENT;
            break;
        default:
            console.error('node type invalid.');
            break;
    }
}

function drawNodeColor(x, y, type) {
    var nodeDiv = mapNodes[y][x];
    switch (type) {
        case NodeType.REACHABLE:
            nodeDiv.style.background = NodeColor.REACHABLE;

            break;
        case NodeType.OBSTACLE:
            nodeDiv.style.background = NodeColor.OBSTACLE;

            break;
        case NodeType.START:
            nodeDiv.style.background = NodeColor.START;

            break;
        case NodeType.FINISH:
            nodeDiv.style.background = NodeColor.FINISH;

            break;
        case NodeType.OPEN:
            nodeDiv.style.background = NodeColor.OPEN;
            break;
        case NodeType.CLOSE:
            nodeDiv.style.background = NodeColor.CLOSE;
            break;
        default:
            console.error('node type invalid.');
            break;
    }

}

function createNodeDiv() {
    var template = document.getElementsByClassName('node_div')[0];
    var newNodeDiv = template.cloneNode(true);

    newNodeDiv.classList.remove('no_display');
    newNodeDiv.style.width = NODE_WIDTH;
    newNodeDiv.style.height = NODE_HEIGHT;

    return newNodeDiv;
}


function swapNode(node1, node2) {
    var tmp = new MapNode();

    tmp.x = node1.x;
    tmp.y = node1.y;
    tmp.f = node1.f;
    tmp.g = node1.g;
    tmp.h = node1.h;
    tmp.parent = node1.parent;

    node1.x = node2.x;
    node1.y = node2.y;
    node1.f = node2.f;
    node1.g = node2.g;
    node1.h = node2.h;
    node1.parent = node2.parent;

    node2.x = tmp.x;
    node2.y = tmp.y;
    node2.f = tmp.f;
    node2.g = tmp.g;
    node2.h = tmp.h;
    node2.parent = tmp.parent;
}

function changeNodeType(node) {
    if (isRunning) {
        alert('算法正在运行，请先重置状态');
        return;
    }

    if (!nodeTypeChangeable) {
        alert('当前状态禁止修改，请重置状态后再操作');
        return;
    }

    var x = node.getAttribute('x');
    var y = node.getAttribute('y');

    x = parseInt(x);
    y = parseInt(y);

    if (map[y][x] === NodeType.OBSTACLE) {
        map[y][x] = NodeType.REACHABLE;
    } else if (map[y][x] === NodeType.REACHABLE) {
        map[y][x] = NodeType.OBSTACLE;
    }

    drawNodeColor(x, y, map[y][x]);
}

var setStart = true;

function setStartAndFinish(nodeDiv) {
    if (isRunning) {
        alert('算法正在运行，请先重置状态');
        return;
    }

    if (!nodeTypeChangeable) {
        alert('当前状态禁止修改，请重置状态后再操作');
        return;
    }

    var x = nodeDiv.getAttribute('x');
    var y = nodeDiv.getAttribute('y');

    x = parseInt(x);
    y = parseInt(y);

    var x0, y0;

    if (setStart) {
        x0 = startNode.x;
        y0 = startNode.y;

        map[y0][x0] = 0;

        drawNodeColor(x0, y0, NodeType.REACHABLE);

        map[y][x] = NodeType.START;
        startNode.x = x;
        startNode.y = y;

        drawNodeColor(x, y, NodeType.START);

        setStart = false;
    } else {
        x0 = finishNode.x;
        y0 = finishNode.y;

        map[y0][x0] = 0;
        drawNodeColor(x0, y0, NodeType.REACHABLE);

        map[y][x] = NodeType.FINISH;

        finishNode.x = x;
        finishNode.y = y;

        drawNodeColor(x, y, NodeType.FINISH);

        setStart = true;
    }
}

function reduction() {
    clearMapArea();
    openList = [];
    closeList = [];
    initMap();
    nodeTypeChangeable = true;
    isRunning = false;
}

function resize() {
    var row = document.getElementById('row_input').value;
    var column = document.getElementById('column_input').value;

    row = parseInt(row);
    column = parseInt(column);

    map.length = row;


    openList = [];
    closeList = [];
    nodeTypeChangeable = true;
    isRunning = false;

    mapWidth = column;
    mapHeight = row;

    var i, j;

    for (i = 0; i < row; ++i) {
        if (map[i] == undefined) {
            map[i] = new Array(column);
        } else {
            map[i].length = column;
        }

        for (j = 0; j < column; ++j) {
            if (map[i][j] == undefined) {
                map[i][j] = 0;
            }
        }
    }

    initData();
    initMap();
    untoggleResize();
    alert('设置完成');
}

function toggleResize() {
    shadowWindow();
    document.getElementById('resize_div').style.display = 'block';
}

function untoggleResize() {
    unshadowWindow();
    document.getElementById('resize_div').style.display = 'none';
}

function shadowWindow() {
    var coverDiv = document.getElementById('cover');

    coverDiv.style.display = 'block';
    coverDiv.style.position = 'fixed';
    coverDiv.style.height = document.body.clientHeight + 'px';
}

function unshadowWindow() {
    var coverDiv = document.getElementById('cover');
    coverDiv.style.display = 'none'
}


/**
 * [Queue]
 * @param {[Int]} size [队列大小]
 */
function Queue(size) {
    var list = [];

    //向队列中添加数据
    this.push = function (data) {
        if (data == null) {
            return false;
        }
        //如果传递了size参数就设置了队列的大小
        if (size != null && !isNaN(size)) {
            if (list.length == size) {
                this.pop();
            }
        }

        list.unshift(data);
        return true;
    }

    //从队列中取出数据
    this.pop = function () {
        return list.pop();
    }

    //返回队列的大小
    this.size = function () {
        return list.length;
    }

    //返回队列的内容
    this.quere = function () {
        return list;
    }

    this.empty = function () {
        return list.length === 0;
    }
}

function bfs() {
    if (isRunning) {
        alert('算法正在运行，请先重置状态');
        return;
    }

    isRunning = true;
    var queue = new Queue(mapWidth * mapHeight);

    var curNode;

    closeList = [];
    queue.push(startNode);

    var success = false;

    while (!queue.empty()) {
        curNode = queue.pop();

        if (inCloseList(curNode) < 0) {
            closeList.push(curNode);
        } else {
            continue;
        }

        if (curNode.equals(finishNode)) {
            finishNode.parent = curNode.parent;
            success = true;
            break;
        }

        var i, j;

        for (i = curNode.x - 1, j = curNode.y; i <= curNode.x + 1; ++i) {
            if (i < 0 || i >= map[0].length) {
                continue;
            }

            let sonNode = new MapNode(i, j);

            bfsCheck(queue, curNode, sonNode);
        }

        for (j = curNode.y - 1, i = curNode.x; j <= curNode.y + 1; ++j) {
            if (j < 0 || j >= map.length) {
                continue;
            }

            let sonNode = new MapNode(i, j);

            bfsCheck(queue, curNode, sonNode);
        }
    }

    if (success) {
        alert('BFS搜索完成，共搜索了 ' + closeList.length + ' 个节点');
        outputPath();
    } else {
        alert('BFS未找到路径');
    }

}

function bfsCheck(queue, curNode, sonNode) {
    // 跳过节点本身和障碍物
    if (sonNode.equals(curNode) || isObstacle(sonNode)) {
        return;
    }

    var pos = inCloseList(sonNode);

    // 如果在 closeList 中就跳过
    if (pos >= 0) {
        return;
    }

    sonNode.parent = curNode;

    queue.push(sonNode);
}

{
    document.getElementById('map_area').oncontextmenu = function () {
        return false;
    };

    initData();
    initMap();
}