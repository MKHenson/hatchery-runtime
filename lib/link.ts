namespace HatcheryRuntime {

    /**
     * The link class is used to connect portals together and pass information from one to the other.
     */
    export class Link implements IRuntimeItem {

        public startBehaviour: Behaviour;
        public endBehaviour: Behaviour;
        public startPortal: Portal;
        public endPortal: Portal;
        public currentFrame: number;
        public frameDelay: number;
        public disposed: boolean;
        public id: number;

        constructor() {
            this.startBehaviour = null;
            this.endBehaviour = null;
            this.startPortal = null;
            this.endPortal = null;
            this.currentFrame = 0;
            this.frameDelay = 0;
            this.disposed = false;
        }

        /**
         * Creates a copy of the link.
         */
        clone(): Link {
            const toRet = new Link();
            toRet.startBehaviour = this.startBehaviour;
            toRet.endBehaviour = this.endBehaviour;
            toRet.startPortal = this.startPortal;
            toRet.endPortal = this.endPortal;
            toRet.currentFrame = this.currentFrame;
            toRet.frameDelay = this.frameDelay;
            return toRet;
        }

        /**
         * Remove listeners
         */
        dispose() {

            this.startBehaviour = null;
            this.endBehaviour = null;
            this.startPortal = null;
            this.endPortal = null;
            this.currentFrame = null;
            this.frameDelay = null;
            this.disposed = true;
        }

        /**
         * Called on each frame
         */
        onFrame( time: number, delta: number ) { }
    }
}
