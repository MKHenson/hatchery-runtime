namespace HatcheryRuntime {

    /**
    * The Runtime class holds an Animate scene in its memory. You can play, stop and execute various
    * behaviours contained within it.
    */
    export class Runtime extends EventDispatcher {

        // A list of runtime objects
        public static runtimes: Runtime[];
        public static initialized: boolean = false;

        // A list of objects that require frame updates
        public static activeItems: IRuntimeItem[];
        public static disposables: IRuntimeItem[];

        public static behaviourFactories: IBehaviourFactory[];
        public static assetFactories: IAssetFactory[];
        public static plugins: IPlugin[];

        public static lastTime: number;

        public assets: Asset[];
        public containers: Container[];
        public groups: Group[];
        private sceneData: any;
        private mNumLoaded: number;
        private mNumToLoad: number;
        private properties: any;
        private name: string;
        private frameProxy: any;
        public id: string;

        constructor() {
            super();

            this.sceneData = {};
            this.assets = [];
            this.containers = [];
            this.groups = [];

            this.mNumLoaded = 0;
            this.mNumToLoad = 0;
            this.frameProxy = this.frame.bind( this );
            Runtime.runtimes.push( this );
        }

        /**
        * Call this to initialize the runtime variables
        */
        static initialize() {
            if ( !Runtime.initialized ) {
                Runtime.runtimes = [];
                Runtime.activeItems = [];
                Runtime.disposables = [];
                Runtime.behaviourFactories = [];
                Runtime.assetFactories = [];
                Runtime.behaviourFactories.push( new LiveBehaviourFactory() );
                Runtime.plugins = [];
                Runtime.initialized = true;
            }
        }

        /**
         * called whenever a container makes progress in its loading
         * @param {Runtime} runtime The runtime object that contains the containner
         * @param {Container} container The container thats being loaded
         * @param {number} percentage The percentage of the loading processs
         */
        static containerLoadProgress( runtime: Runtime, container: Container, percentage: number ) {
            const plugins = Runtime.plugins;
            for ( const plugin of plugins )
                plugin.onLoadProgress( container, percentage );

            runtime.emit<Events.RuntimeEvents, Events.IRuntimeEvent>( 'load-progress', { container: container, percentage: percentage });
        }

        /**
         * Called whenever the browser wants to refresh with a new frame.
         * @param {number} time
         * @returns {any}
         */
        frame( time: number ) {
            const delta = time - Runtime.lastTime;
            Runtime.lastTime = time;

            const activeItems: IRuntimeItem[] = [];
            const rActiveItems = Runtime.activeItems;

            for ( const item of rActiveItems )
                activeItems.push( item );


            const plugins = Runtime.plugins;
            for ( const plugin of plugins )
                plugin.onFrame( time, delta );


            let link: Link;
            for ( const item of activeItems ) {

                if ( rActiveItems.indexOf( item ) === -1 )
                    continue;

                if ( item.disposed ) {
                    rActiveItems.splice( rActiveItems.indexOf( item ), 1 );
                    continue;
                }

                if ( item instanceof Link ) {
                    link = <Link>item;

                    if ( link.currentFrame >= link.frameDelay ) {

                        link.currentFrame = 0;

                        if ( link.endPortal.type === 'parameter' ) {

                            // Not sure if this is right...
                            rActiveItems.splice( rActiveItems.indexOf( link ), 1 );
                            link.endPortal.value = link.startPortal.value;
                            link.endBehaviour.parameterFilled.call( link.endBehaviour, link.endPortal );
                        }
                        else if ( link.endPortal.type === 'input' || link.endPortal.type === 'output' ) {
                            rActiveItems.splice( rActiveItems.indexOf( link ), 1 );
                            link.endBehaviour.enter.call( link.endBehaviour, link.endPortal.name, link.endPortal );
                        }
                    }
                    else
                        link.currentFrame++;
                }
                else
                    item.onFrame.call( item, time, delta );
            }

            // Update assets
            const runtimes = Runtime.runtimes;
            for ( const runtime of runtimes ) {
                const assets = runtime.assets;
                for ( const asset of assets ) {
                    if ( asset.onFrame )
                        asset.onFrame( time, delta );
                }
            }

            // Lets do some cleanup
            const disposables = Runtime.disposables;
            for ( const disposable of disposables ) {
                disposable.dispose();

                // remove from active items
                if ( rActiveItems.indexOf( disposable ) !== -1 )
                    rActiveItems.splice( rActiveItems.indexOf( disposable ), 1 );

                // remove from root containers
                if ( this.containers.indexOf( disposable as Container ) !== -1 )
                    this.containers.splice( this.containers.indexOf( disposable as Container ), 1 );

                // remove from root assets
                if ( this.assets.indexOf( disposable as Asset ) !== -1 )
                    this.assets.splice( this.assets.indexOf( disposable as Asset ), 1 );
            }

            disposables.splice( 0, disposables.length );

            // If there are no more containers - then this runtime is ready to be destroyed.
            if ( this.containers.length === 0 ) {
                this.dispose();
                return;
            }

            // Get the frame updates started
            window.requestAnimationFrame( this.frameProxy );
        }

        /**
         * Returns an asset by its ID
         * @param {string} id The id of the asset
         * @param {boolean} bySceneID Should we compare the id's of the ID in the scene when it was exported or its runtime ID.
         * The default is true.
         * @returns {Asset}
         */
        getAsset( id: string, bySceneID: boolean = true ): Asset {

            if ( id === undefined || id === null || id === '' )
                return null;

            const assets = this.assets;

            if ( bySceneID ) {
                for ( const asset of assets )
                    if ( asset.shallowId === id )
                        return asset;
            }
            else {
                for ( const asset of assets )
                    if ( asset.id === id )
                        return asset;
            }

            return null;
        }

        /**
         * Returns an group by its ID
         * @param {string | number} id The id of the group
         * @param {bool} bySceneID Should we compare the id's of the ID in the scene when it was exported or its runtime ID.
         * The default is true.
         * @returns {Group}
         */
        getGroup( id: string | number, bySceneID: boolean = true ): Group {
            if ( id === undefined || id === null || id === '' )
                return null;

            const groups = this.groups;

            if ( bySceneID ) {
                for ( const group of groups )
                    if ( group.shallowId === id )
                        return group;
            }
            else {
                for ( const group of groups )
                    if ( group.id === id )
                        return group;
            }

            return null;
        }

        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose() {

            Runtime.runtimes.splice( Runtime.runtimes.indexOf( this ), 1 );

            const containers = this.containers;
            for ( const container of containers ) {
                container.off<Events.ContainerEvents, Events.IContainerEvent>( 'container-loaded', this.onContainerLoaded, this );
                container.dispose();
            }

            const assets = this.assets;
            for ( const asset of assets )
                asset.dispose();

            const groups = this.groups;
            for ( const group of groups )
                group.dispose();

            this.assets = null;
            this.groups = null;
            this.properties = null;
            this.id = null;
            this.name = null;
            this.sceneData = null;
            this.frameProxy = null;

            // Call super-class constructor
            super.dispose();
        }


        /**
         * Use this function begin the process of loading and executing the behaviours and their assets
         */
        start() {

            // Get the frame updates started
            window.requestAnimationFrame( this.frameProxy );

            const containers = this.containers;
            let i = containers.length;
            this.mNumLoaded = 0;
            this.mNumToLoad = 0;
            const plugins = Runtime.plugins;

            // First count the number of containers we need to load
            for ( const container of containers ) {
                if ( !container.loaded && containers[ i ].properties[ 'Start On Load' ] === true )
                    this.mNumToLoad++;
            }

            // If no containers need loading then just start
            if ( this.mNumToLoad === 0 ) {
                for ( const container of containers )
                    if ( container.properties[ 'Start On Load' ] === true ) {
                        container.start();

                        for ( const plugin of plugins )
                            plugin.onContainerEnter( container );
                    }
            }
            else {
                for ( const container of containers )
                    if ( !container.loaded && container.properties[ 'Start On Load' ] === true ) {
                        container.on<Events.ContainerEvents, Events.IContainerEvent>( 'container-loaded', this.onContainerLoaded, this );
                        container.load();
                    }
            }
        }

        /**
         * Called when a container has fully loaded have completed loading
         */
        onContainerLoaded( response: Events.ContainerEvents, data: Events.IContainerEvent, sender?: EventDispatcher ) {
            this.mNumLoaded++;
            const plugins = Runtime.plugins;
            data.container.off<Events.ContainerEvents, Events.IContainerEvent>( 'container-loaded', this.onContainerLoaded, this );

            if ( this.mNumLoaded >= this.mNumToLoad ) {
                const containers = this.containers;
                for ( const container of containers ) {
                    if ( container.properties[ 'Start On Load' ] === true ) {
                        container.start();
                        Runtime.activeItems.push( container );

                        for ( const plugin of plugins )
                            plugin.onContainerEnter( container );
                    }
                }
            }
        }
    }
}
