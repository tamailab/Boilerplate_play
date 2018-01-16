(function (THREE) {

    'use strict';

    /**
     * コントローラに付属するポインタ（ライン）
     */
    function VRPointer(controller, color, length) {

        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0)); 
        geometry.vertices.push(new THREE.Vector3(1, 0, 0)); 

        this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: color}));

        let _startPos = null;
        let _endPos   = null;
        let _forward  = null;

        /**
         * Lineのudpate
         */
        this.update = () => {
            _startPos = new THREE.Vector3(0, 0, 0);
            controller.localToWorld(_startPos);

            _forward = new THREE.Vector4(0, 0, -1, 0);
            _forward.applyMatrix4(controller.matrix);
            _forward.multiplyScalar(length);

            _endPos = new THREE.Vector3().addVectors(_startPos, _forward);

            this.line.geometry.vertices[0] = _startPos;
            this.line.geometry.vertices[1] = _endPos;
            this.line.geometry.verticesNeedUpdate = true;
            this.line.geometry.computeBoundingSphere();
        };

        this.raycast = (targets) => {
            let dir = new THREE.Vector3().subVectors(_endPos, _startPos).normalize();
            let ray = new THREE.Raycaster(_startPos, dir); 

            let objs = ray.intersectObjects(targets);
            if (objs.length <= 0) {
                return null;
            }

            return objs[0].object;
        };
    }

    // Exports
    window.VRPointer = VRPointer;

}(THREE));