(function (THREE) {

    'use strict';

    /**
     * VRControllerで操作できる対象
     */
    function VRMover(target) {

        this.target = target;
        this.grabber = null;

        // 掴んだときのコントローラとの距離
        let _distance = 0.0;

        // 掴んだときのコントローラの回転
        let _offsetQuat = new THREE.Quaternion();
        let _offsetPos = new THREE.Vector3();

        let _worldPos = new THREE.Vector3();
        let _worldRot = new THREE.Quaternion();
        let _worldScale = new THREE.Vector3();

        let _scale = new THREE.Vector3(1, 1, 1);

        /**
         * 掴まれた
         */
        this.grab = (grabber) => {
            this.grabber = grabber;

            // ワールド座標でのGrabberの状態を取得
            let grabberWPos = new THREE.Vector3();
            let grabberWRot = new THREE.Quaternion();
            let grabberWScale = new THREE.Vector3();
            this.grabber.matrixWorld.decompose(grabberWPos, grabberWRot, grabberWScale);

            // ワールド座標でのtargetの状態を取得
            let targetWPos = new THREE.Vector3();
            let targetWRot = new THREE.Quaternion();
            let targetWScale = new THREE.Vector3();
            this.target.matrixWorld.decompose(targetWPos, targetWRot, targetWScale);

            // オブジェクトのスケールを保持しておく
            _scale = targetWScale;

            // オブジェクトとの距離
            _distance = targetWPos.distanceTo(grabberWPos);

            // オブジェクトの回転のオフセット
            _offsetQuat = grabberWRot.inverse().multiply(targetWRot);

            let pose = this.getPose();
            _offsetPos = new THREE.Vector3().subVectors(targetWPos, pose.position);
        };

        /**
         * 掴まれなくなった
         */
        this.ungrab = () => {
            this.grabber = null;
        };

        /**
         * Update処理
         */
        this.update = () => {
            if (this.grabber == null) {
                return;
            }

            let pose = this.getPose();
            pose.position.add(_offsetPos);
            pose.rotation.multiply(_offsetQuat);

            this.target.matrix.compose(pose.position, pose.rotation, _scale);
            this.target.matrixAutoUpdate = false;
            this.target.updateMatrixWorld(false);
        };

        /**
         * 掴んだ状態の姿勢を計算する
         */
        this.getPose = () => {

            // コントローラの前方を得る
            let forward = new THREE.Vector4(0, 0, -1, 0);
            forward.applyMatrix4(this.grabber.matrix).normalize();
            forward.multiplyScalar(_distance);

            // ワールド座標での状態を取得
            this.grabber.matrixWorld.decompose(_worldPos, _worldRot, _worldScale);

            // 最終的な位置、回転を計算
            let pos = forward.add(_worldPos);

            return {
                position: pos,
                rotation: _worldRot
            };
        }
    }

    // Exports
    window.VRMover = VRMover;

}(THREE));