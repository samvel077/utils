import { Point, arePointsEquals } from './utils';

export function isPointInsidePolygon(p: Point, polygon: Point[]): boolean {
  if (isPointOnPolygon(p, polygon)) return false;
  
  const line = { p1: { x: Number.MAX_VALUE * 0.9, y: p.y }, p2: p };
  const intersections = countLineIntersectionsOfPolygon(line, polygon, -1);
  
  return (intersections % 2) == 1;
}

export function isPolylineSelfIntersected(polyline: Point[], newPoint: Point): boolean {
  if (polyline.length < 2) return false;
    
  const newLine = { p1: polyline[polyline.length - 1], p2: newPoint };
  for (let i = 0; i < polyline.length - 2; i++) {
    const line = { p1: polyline[i], p2: polyline[i + 1] };
    if (intersects(newLine, line)) return true;
  }
  
  const lastLine = { p1: polyline[polyline.length - 2], p2: polyline[polyline.length - 1] };
  return isPointOnLine(lastLine, newPoint) || isPointOnLine(newLine, lastLine.p1);
}

export function isLineIntersectsPolygon(line: { p1: Point, p2: Point },
                                        polygon: Point[]): boolean {
  const intersections = countLineIntersectionsOfPolygon(line, polygonToClockwise(polygon), 1);
  return intersections > 0;
}

function countLineIntersectionsOfPolygon(line: { p1: Point, p2: Point },
                                         polygon: Point[],
                                         maxIntersections: number): number {
  let intersections = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = i + 1 < polygon.length ? polygon[i + 1] : polygon[i + 1 - polygon.length];
    const p3 = i + 2 < polygon.length ? polygon[i + 2] : polygon[i + 2 - polygon.length];
      
    if (isLineIntersectsPolygonSegment(line, { p1, p2 }, p3)) {
      intersections++;
    }
    
    if (intersections == maxIntersections) break;
  }
  
  return intersections;
}

function isPointOnPolygon(p: Point, polygon: Point[]): boolean  {
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = i + 1 < polygon.length ? polygon[i + 1] : polygon[i + 1 - polygon.length];
      
    if (isPointOnLine({ p1, p2 }, p)) return true;
  }
  
  return false;
}

function isLineIntersectsPolygonSegment(line: { p1: Point, p2: Point }, 
                                        polygonSegment: { p1: Point, p2: Point },
                                        nextPolygonPoint: Point): boolean {
  // проверяем лежат ли вершины сегмента на линии
  const vertex1OnLine = isPointOnLine(line, polygonSegment.p1);
  const vertex2OnLine = isPointOnLine(line, polygonSegment.p2);
  
  // проход через вершину полигона проверяется только для второй точки
  // иначе проход через вершину будет посчитан два раза
  if (!vertex2OnLine && vertex1OnLine)
    return false;
  
  // если первая точка отрезка лежит на сегменте полигона то делаем отдельную проверку
  if (isPointOnLine(polygonSegment, line.p1)) {
    return checkFromRibIntersection(line, polygonSegment, nextPolygonPoint);
  }
  
  // если вершина сегмента лежит на отрезке то это
  // либо проход сквозь вершину внутрь полигона
  // либо проход через вершину по касательной
  if (vertex2OnLine) {
    return checkVertexIntersection(line, polygonSegment, nextPolygonPoint);
  }
  
  // проверяем пересекает ли отрезок сегмент
  // если хотя бы одна точка отрезка лежит на сегменте
  // то не проверяем
  // т. к. случай первой точки уже проверен
  // а нахождение второй точки не запрещается при условии что первая точка вне полигона
  return !isPointOnLine(polygonSegment, line.p1) &&
         !isPointOnLine(polygonSegment, line.p2) &&
         intersects(line, polygonSegment);
}

function checkVertexIntersection(line: { p1: Point, p2: Point }, 
                                 polygonSegment: { p1: Point, p2: Point },
                                 nextPolygonPoint: Point): boolean {                          
    if (isInnerAngle(polygonSegment, nextPolygonPoint)) {
      // далее логика внутреннего угла
      // если угол внутренний то пересечения нет только если p2 точно на вершине 
      return !arePointsEquals(line.p2, polygonSegment.p2);
    } else {
      // далее логика внешнего угла
      // если вторая точка точно на вершине то пересечения нет
      if (arePointsEquals(line.p2, polygonSegment.p2))
        return false;
      
      // если линия также проходит через первую точку или следующую
      // то линия скользит прямо по сегменту полигон и пересечения нет
      if (isPointOnLine(line, polygonSegment.p1) ||
          isPointOnLine(line, nextPolygonPoint))
        return false;
          
      // если вторая точка внутри треугольника
      // или пересекает треугольник
      // то пересечение есть
      if (intersects(line, { p1: polygonSegment.p1, p2: nextPolygonPoint }) ||
          isPointInsideTrigon(line.p2, polygonSegment.p1, polygonSegment.p2, nextPolygonPoint))
        return true;
      
      // иначе проход через вершину по касательной
      return false;
    }       
}

function checkFromRibIntersection(line: { p1: Point, p2: Point }, 
                                  polygonSegment: { p1: Point, p2: Point },
                                  nextPolygonPoint: Point): boolean {

  if (isInnerAngle(polygonSegment, nextPolygonPoint)) {
    // далее логика внутреннего угла
    // если отрезок пересекает наружную линию треугольника, то пересечения с полигоном нет
    if (intersects(line, { p1: polygonSegment.p1, p2: nextPolygonPoint }))
       return false;
       
    // если вторая точка внутри треугольника, то пересечения с полигоном нет
    if (isPointInsideTrigon(line.p2, polygonSegment.p1, polygonSegment.p2, nextPolygonPoint) ||
        isPointOnLine({ p1: polygonSegment.p2, p2: nextPolygonPoint }, line.p2) ||
        isPointOnLine({ p1: polygonSegment.p1, p2: polygonSegment.p2 }, line.p2))
      return false;
      
    // иначе есть пересечение
    return true;
  } else {
    // далее логика внешнего угла
    if (!isPointOnLine(line, polygonSegment.p1) &&
        !isPointOnLine(line, nextPolygonPoint) &&
        intersects(line, { p1: polygonSegment.p1, p2: nextPolygonPoint })) {
        return true;
      }
    
    const p1OnRib = isPointOnLine({ p1: polygonSegment.p1, p2: polygonSegment.p2 }, line.p1);
    const p1OnNextRib = isPointOnLine({ p1: polygonSegment.p2, p2: nextPolygonPoint }, line.p1);
    const p2OnRib = isPointOnLine({ p1: polygonSegment.p1, p2: polygonSegment.p2 }, line.p2);
    const p2OnNextRib = isPointOnLine({ p1: polygonSegment.p2, p2: nextPolygonPoint }, line.p2);
    
    const onSameRib = p1OnRib && p2OnRib || p1OnNextRib && p2OnNextRib;
    const onDiffrentRib = !onSameRib && (p1OnRib && p2OnNextRib || p2OnRib && p1OnNextRib);
    
    // Если вторая точка отрезка находится внутри треугольника посторенного по вершинам угла 
    // то отрезок зашел внутрь угла
    if (onDiffrentRib ||
        isPointInsideTrigon(line.p2, polygonSegment.p1, polygonSegment.p2, nextPolygonPoint)) {
      return true;
    }
    
    // иначе пересечения нет
    return false;
  }
}

function isInnerAngle(polygonSegment: { p1: Point, p2: Point },
                      nextPolygonPoint: Point): boolean {
    const or = orientation(polygonSegment.p1, polygonSegment.p2, nextPolygonPoint);
    
    // т.к. полигон закручен по часовой то внутренний угол закручен против
    return or == 2;
}

function normolizePolygon(polygon: Point[]): Point[] {
  let minIndex = 0;
  let minX = polygon[minIndex].x;
  let minY = polygon[minIndex].y;
  
  polygon.forEach((p, index) => {
    if (p.x < minX) {
      minX = p.x;
      minIndex = index;
    }
    if (p.y < minY) {
      minY = p.y;
      minIndex = index;
    }
  });
  
  let res = [ polygon[minIndex] ];
  for (let number = 1; number < polygon.length; number++) {
    let index = minIndex + number;
    if (index >= polygon.length) index -= polygon.length;
    
    let nextPointIndex = minIndex + number + 1;
    if (nextPointIndex >= polygon.length) nextPointIndex -= polygon.length;
    
    if (isPointOnLine({ p1: res[res.length - 1], p2: polygon[nextPointIndex] }, polygon[index]))
      continue;
      
    res.push(polygon[index]);
  }
  
  return res;
}

function polygonToClockwise(polygon: Point[]): Point[] {
  let newPolygon = normolizePolygon(polygon);
  
  const a = polygon[0];
  const b = polygon[1];
  const c = polygon[polygon.length - 1];
  if (orientation(a, b, c) == 2)
    return newPolygon.reverse();
  
  return newPolygon;
}

/**
 * Проверяет находится ли точка внутри треугольника
 * @param s  точка
 * @param a  вершина треугольника 1
 * @param b  вершина треугольника 2
 * @param c  вершина треугольника 3
 */
function isPointInsideTrigon(s: Point, a: Point, b: Point, c: Point): boolean {
    const as_x = s.x-a.x;
    const as_y = s.y-a.y;

    const s_ab = (b.x-a.x)*as_y-(b.y-a.y)*as_x > 0;
    if((c.x-a.x)*as_y-(c.y-a.y)*as_x > 0 == s_ab) return false;
    if((c.x-b.x)*(s.y-b.y)-(c.y-b.y)*(s.x-b.x) > 0 != s_ab) return false;

    return true;
}

function intersects(line1: { p1: Point, p2: Point }, line2: { p1: Point, p2: Point }): boolean { 
    // Find the four orientations needed for general and 
    // special cases 
    const o1 = orientation(line1.p1, line1.p2, line2.p1); 
    const o2 = orientation(line1.p1, line1.p2, line2.p2); 
    const o3 = orientation(line2.p1, line2.p2, line1.p1); 
    const o4 = orientation(line2.p1, line2.p2, line1.p2); 
  
    // General case 
    if (o1 != o2 && o3 != o4)
        return true;
  
    // Special Cases 
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1 
    if (o1 == 0 && onColinearLine(line1, line2.p1)) return true; 
  
    // p1, q1 and q2 are colinear and q2 lies on segment p1q1 
    if (o2 == 0 && onColinearLine(line1, line2.p2)) return true; 
  
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2 
    if (o3 == 0 && onColinearLine(line2, line1.p1)) return true; 
  
     // p2, q2 and q1 are colinear and q1 lies on segment p2q2 
    if (o4 == 0 && onColinearLine(line2, line1.p2)) return true; 
  
    return false; // Doesn't fall in any of the above cases 
} 

// Given three colinear points p, q, r, the function checks if 
// point q lies on line segment 'pr' 
function onColinearLine(line: { p1: Point, p2: Point }, q: Point): boolean { 
    if (q.x <= Math.max(line.p1.x, line.p2.x) && q.x >= Math.min(line.p1.x, line.p2.x) && 
        q.y <= Math.max(line.p1.y, line.p2.y) && q.y >= Math.min(line.p1.y, line.p2.y)) 
       return true; 
  
    return false; 
} 

// To find orientation of ordered triplet (p, q, r). 
// The function returns following values 
// 0 --> p, q and r are colinear 
// 1 --> Clockwise 
// 2 --> Counterclockwise 
function orientation(p: Point, q: Point, r: Point): number { 
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/ 
    // for details of below formula. 
    const val = (q.y - p.y) * (r.x - q.x) - 
                (q.x - p.x) * (r.y - q.y); 
  
    if (val == 0) return 0;  // colinear 
  
    return (val < 0) ? 1 : 2; // clock or counterclock wise 
}

/**
 * Проверяет находится ли точка на отрезке
 * @param line  отрезок
 * @param p  точка
 */
function isPointOnLine(line: { p1: Point, p2: Point }, p: Point) {
  const p1 = line.p1.x <= line.p2.x ? line.p1 : line.p2;
  const p2 = line.p1.x <= line.p2.x ? line.p2 : line.p1;
    
  if (p.x < p1.x || p.x > p2.x)
    return false;
    
  if (p1.x == p2.x)
    return Math.min(p1.y, p2.y) <= p.y && Math.max(p1.y, p2.y) >= p.y;
    
  const lineSlope = (p2.y - p1.y) / (p2.x - p1.x);
  const lineIntercept = p1.y - lineSlope * p1.x;
  
  return Math.abs(lineSlope * p.x + lineIntercept - p.y) < 0.01;
}