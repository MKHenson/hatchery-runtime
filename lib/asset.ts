namespace HatcheryRuntime {

    /**
     * Assets are objects that act as model data within a scene. Typically they act within a scene, and
     * behaviours interact with them to change the state of the application
     */
    export class Asset extends EventDispatcher implements IRuntimeItem {

        public loaded: boolean;
        public runtime: Runtime;
        public instance: any;
        public containerRefCount: number;
        public properties: any;
        public className: string;
        public name: string;
        public initialized: boolean;
        public noLoading: boolean;
        public shallowId: any;
        public id: string;

        constructor( runtime: Runtime ) {
            super();
            this.instance = null;
            this.runtime = runtime;
            this.name = null;
            this.className = null;
            this.properties = {};
            this.loaded = false;
            this.initialized = false;
            this.noLoading = false;
            this.containerRefCount = 0;
        }

        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose() {
            delete this.properties;
            if ( this.instance )
                this.instance._asset = null;

            this.instance = null;
            this.properties = null;
            this.name = null;
            this.runtime = null;

            // Call super-class constructor
            super.dispose();
        }

        /**
         * Called whenever we update a frame
         * @param {number} totalTime The total time since the application loaded in MS
         * @param {number} delta The delta time  in MS
         */
        onFrame( totalTime: number, delta: number ) { }

        /**
         * Loads the asset into memory
         * @param {any} instance The optional instance that this asset wraps around
         */
        load( instance?: any ) {
            this.loaded = false;
            if ( instance !== undefined ) {
                this.instance = instance;
                instance._asset = this;
            }

            if ( this.noLoading )
                this.loadComplete();
        }

        /**
         * Called after everything has been loaded. This is a good function to override if your properties rely on other loaded assets.
         */
        initialize() {
        }

        /**
         * Called when this asset is completed loading
         */
        loadComplete() {
            this.loaded = true;
            this.emit<Events.AssetEvents, Events.IAssetEvent>( 'asset-loaded', { asset: this });
        }
    }
}
