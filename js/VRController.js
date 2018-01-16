(function (THREE) {

    /**
     * ゲームパッドの参照を見つける
     */
    const findGamepad = (id) => {

        if (!navigator.getGamepads) {
            console.error("Gamepad API is not supported.");
            return null;
        }

        let gamepads = navigator.getGamepads(); 
        for (let i = 0, j = 0; i < 4; i++) {
            let gamepad = gamepads[i];
            if (!gamepad) {
                continue;
            }

            // TODO: Oculus TouchのIDについてはあとで調べる
            let likeVRPad = (gamepad.id === 'OpenVR Gamepad') || (gamepad.id === 'Oculus Touch');
            if (!likeVRPad) {
                continue;
            }

            if (j === id) {
                return gamepad;
            }
            j++;
        }
    }

    /**
     * VR用コントローラを表示する
     */
    function VRController(id) {

        THREE.Object3D.call(this);

        let _gamepad;

        this.gamePadId = id;

        this.axes = [0, 0];
        this.thumbpadIsPressed = false;
        this.triggerIsPressed = false;
        this.triggerValue = 0;
        this.gripsAsPressed = false;
        this.menuIsPressed = false;
        this.sideButtonIsPressed = false;

        // ルームスケール用のマトリクスを保持する
        this.standingMatrix = new THREE.Matrix4();

        this.matrixAutoUpdate = false;

        /**
         * Gamepadの参照を得る
         */
        this.getGamepad = function () {
            return _gamepad;
        };
    }

    VRController.prototype = Object.create(THREE.Object3D.prototype);
    VRController.prototype.constructor = VRController;

    /**
     * Update。コントローラの姿勢を制御する
     */
    VRController.prototype.update = function () {

        let gamepad = findGamepad(this.gamePadId);

        if (gamepad === undefined) {
            this.visible = false;
            return;
        }

        if (gamepad.pose === undefined) {
            this.visible = false;
            return;
        }

        if (gamepad.pose === null) {
            return;
        }

        // コントローラの制御
        let pose = gamepad.pose;
        if (pose.position !== null) {
            this.position.fromArray(pose.position);
        }

        if (pose.orientation !== null) {
            this.quaternion.fromArray(pose.orientation);
        }

        // デバイスからの情報を元に姿勢を更新し、ルームスケールのマトリクスを掛けて最終的な姿勢を決定する
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.matrix.multiplyMatrices(this.standingMatrix, this.matrix);
        this.matrixWorldNeedsUpdate = true;
        this.visible = true;

        // タッチパッドの触れている位置
        this.axes[0] = gamepad.axes[0];
        this.axes[1] = gamepad.axes[1];

        // タッチパッドのクリック
        this.thumbpadIsPressed = gamepad.buttons[0].pressed;

        // トリガー
        this.triggerIsPressed = gamepad.buttons[1].pressed;
        this.triggerValue = gamepad.buttons[1].value;

        // サイドボタン
        this.sideButtonIsPressed = gamepad.buttons[2].pressed;

        // メニューボタン
        this.menuIsPressed = gamepad.buttons[3].pressed;
    };

    // Exports
    window.VRController = VRController;

}(THREE));