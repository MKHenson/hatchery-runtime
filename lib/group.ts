namespace HatcheryRuntime {

    /**
     * A group is an object that contains an array of scene instances
     */
    export class Group extends Asset {
        public assets: Asset[];

        constructor( runtime: Runtime ) {
            super( runtime );
            this.assets = [];
        }

        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose() {
            this.assets = null;
            super.dispose();
        }
    }
}
