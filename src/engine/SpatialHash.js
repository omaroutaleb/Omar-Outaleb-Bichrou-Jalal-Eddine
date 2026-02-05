// ============================================
// SpatialHash - Uniform Grid Spatial Partitioning
// ============================================

import { SPATIAL } from '../config.js';

export class SpatialHash {
    constructor(cellSize = SPATIAL.CELL_SIZE) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    
    // Convert world position to cell key
    _getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }
    
    // Get cell indices from position
    _getCellIndices(x, y) {
        return {
            cx: Math.floor(x / this.cellSize),
            cy: Math.floor(y / this.cellSize)
        };
    }
    
    // Clear all cells
    clear() {
        this.cells.clear();
    }
    
    // Insert an entity
    insert(entity) {
        const key = this._getKey(entity.pos.x, entity.pos.y);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(entity);
    }
    
    // Insert multiple entities
    insertAll(entities) {
        for (const entity of entities) {
            if (entity.alive) {
                this.insert(entity);
            }
        }
    }
    
    // Query entities within radius of a position
    query(x, y, radius) {
        const results = [];
        const { cx: minCx, cy: minCy } = this._getCellIndices(x - radius, y - radius);
        const { cx: maxCx, cy: maxCy } = this._getCellIndices(x + radius, y + radius);
        
        const radiusSq = radius * radius;
        
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.cells.get(key);
                if (cell) {
                    for (const entity of cell) {
                        const dx = entity.pos.x - x;
                        const dy = entity.pos.y - y;
                        if (dx * dx + dy * dy <= radiusSq) {
                            results.push(entity);
                        }
                    }
                }
            }
        }
        
        return results;
    }
    
    // Query entities near another entity (excludes self)
    queryNear(entity, radius) {
        const results = this.query(entity.pos.x, entity.pos.y, radius);
        return results.filter(e => e !== entity);
    }
    
    // Get all occupied cell keys (for debug drawing)
    getOccupiedCells() {
        const cells = [];
        for (const [key, entities] of this.cells) {
            if (entities.length > 0) {
                const [cx, cy] = key.split(',').map(Number);
                cells.push({
                    x: cx * this.cellSize,
                    y: cy * this.cellSize,
                    count: entities.length
                });
            }
        }
        return cells;
    }
}
