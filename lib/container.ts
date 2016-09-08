namespace HatcheryRuntime {

    /**
     * A Container class contains a list of links, assets and behaviours as well as optional scene logic.
     * They are also responsible for loading, unloading and executing the contents within. Each scene needs at least 1 container in order
     * to work.
     */
    export class Container extends Behaviour {

        public name: string;
        public behaviours: Behaviour[];
        public assets: Asset[];
        public groups: Group[];
        public activeInstances: Behaviour[];
        public properties: any;
        public plugins: any;
        public loaded: boolean;
        public unloadOnExit: boolean;
        public startOnLoad: boolean;
        private mNumLoaded: number;
        private mNumToLoad: number;
        private isLoading: boolean;
        private portalsToExecute: Portal[];

        constructor( runtime: Runtime ) {
            super( runtime );
            this.name = null;
            this.behaviours = [];
            this.assets = [];
            this.groups = [];
            this.properties = {};
            this.loaded = false;
            this.activeInstances = [];
            this.mNumLoaded = 0;
            this.mNumToLoad = 0;
            this.startOnLoad = false;
            this.unloadOnExit = false;
            this.isLoading = false;
            this.portalsToExecute = [];
        }

        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose() {
            const activeItems = Runtime.activeItems;
            const behaviours = this.behaviours;
            const assets = this.assets;

            for ( const behaviour of behaviours ) {
                if ( activeItems.indexOf( behaviour ) !== -1 )
                    activeItems.splice( activeItems.indexOf( behaviour ), 1 );

                behaviour.dispose();
            }

            for ( const asset of assets )
                asset.off<Events.AssetEvents, Events.IAssetEvent>( 'asset-loaded', this.onAssetLoaded, this );

            this.behaviours = null;
            this.assets = null;
            this.groups = null;
            this.activeInstances = null;
            this.behaviours = null;
            this.assets = null;
            this.properties = null;
            this.plugins = null;
            this.portalsToExecute = null;
            this.startOnLoad = null;

            super.dispose();
        }

        /**
         * Loads the asset into memory
         */
        load() {
            this.mNumLoaded = 0;
            this.mNumToLoad = 0;

            const assets = this.assets;
            if ( assets.length === 0 ) {
                this.onLoadComplete();
                return;
            }

            for ( const asset of assets )
                if ( asset.loaded === false && asset.noLoading === false )
                    this.mNumToLoad++;

            for ( const asset of assets )
                if ( asset.loaded === false && asset.noLoading === false ) {
                    asset.on<Events.AssetEvents, Events.IAssetEvent>( 'asset-loaded', this.onAssetLoaded, this );
                    asset.load();
                }

            if ( this.mNumToLoad === 0 )
                this.onLoadComplete();
        }

        /**
         * Gets all behaviour references and their children
         * @returns {Behaviour[]}
         */
        flatten( arr: Behaviour[] = [] ): Behaviour[] {
            arr.push( this );

            const behaviours = this.behaviours;

            for ( const behaviour of behaviours ) {
                if ( behaviour instanceof Container )
                    behaviour.flatten( arr );
                else if ( behaviour instanceof InstanceBehaviour ) {
                    behaviour.instance.flatten( arr );
                    arr.push( behaviour );
                }
                else
                    arr.push( behaviour );
            }

            return arr;

        }

        /**
         * Clones the behaviour
         * @parameter {Behaviour} val [Optional] The child parent clone
         * @returns {Behaviour}
         */
        clone( val?: Behaviour ): Behaviour {

            let clonedChild: Behaviour;
            const behaviours = this.behaviours;
            const clone = super.clone( new Container( this.runtime ) ) as Container;
            let clonedLinks = clone.getLinks();
            clone.name = this.name;

            // First clone each of the behaviours and set the new parent container to the clone
            for ( const behaviour of behaviours ) {
                clonedChild = behaviour.clone();
                clone.behaviours.push( clonedChild );
                clonedChild.container = clone;
                clonedLinks = clonedLinks.concat( clonedChild.getLinks() );
            }

            const containerBehaviours = this.behaviours.slice( 0, this.behaviours.length );
            const cloneBehaviours = clone.behaviours.slice( 0, clone.behaviours.length );
            containerBehaviours.push( this );
            cloneBehaviours.push( clone );


            // Go through each of the links that are still pointing to the original portals
            // and behaviours, and re-assign them to the new ones.
            for ( const clonedLink of clonedLinks ) {
                for ( let i = 0, l = containerBehaviours.length; i < l; i++ ) {
                    let child = containerBehaviours[ i ];

                    if ( child.portals.indexOf( clonedLink.startPortal ) !== -1 )
                        clonedLink.startPortal = cloneBehaviours[ i ].portals[ child.portals.indexOf( clonedLink.startPortal ) ];

                    if ( child.portals.indexOf( clonedLink.endPortal ) !== -1 )
                        clonedLink.endPortal = cloneBehaviours[ i ].portals[ child.portals.indexOf( clonedLink.endPortal ) ];

                    if ( clonedLink.startBehaviour === child )
                        clonedLink.startBehaviour = cloneBehaviours[ i ];

                    if ( clonedLink.endBehaviour === child )
                        clonedLink.endBehaviour = cloneBehaviours[ i ];
                }
            }

            // Clones the property objects
            clone.properties = this.properties;
            clone.plugins = this.plugins;

            // Copy the asset and group references
            clone.assets = this.assets.slice( 0, this.assets.length );
            clone.groups = this.groups.slice( 0, this.groups.length );

            // Increment the reference counts
            for ( const asset of clone.assets )
                asset.containerRefCount++;
            for ( const group of clone.groups )
                group.containerRefCount++;

            clone.startOnLoad = this.startOnLoad;
            clone.unloadOnExit = this.unloadOnExit;
            return clone;
        }

        /**
         * This function is called when the behaviour is entered by the Runtime. This is where
         * all execution logic should go. The behaviour will remain active until this.exit() is called.
         * @param {string} portalName The name of the input portal we are entering through.
         * @param {Portal} portal The actual input portal we entered through
         */
        enter( portalName: string, portal: Portal ) {

            // Anything except inputs just do normal behaviour
            if ( portal.type === 'output' ) {
                let behavioursStillActive = false;
                const behaviours = this.behaviours;
                for ( const behaviour of behaviours )
                    if ( behaviour.isActive ) {
                        behavioursStillActive = true;
                        break;
                    }

                // Get all instances to exit
                const activeInstances = this.activeInstances;
                for ( const instance of activeInstances ) {
                    const products = instance.products;
                    for ( const product of products ) {
                        for ( let myProd = 0; myProd < this.products.length; myProd++ ) {
                            if ( this.products[ myProd ].name === product.name ) {
                                product.value = this.products[ myProd ].value;
                                break;
                            }
                        }
                    }

                    if ( behavioursStillActive )
                        instance.exit( portalName, true );
                    else
                        instance.exit( portalName, false );
                }

                // If this must unload on exit. Then we add it to the Runtime disposables
                const assets = this.assets;
                const groups = this.groups;
                const toRemove: Asset[] = [];

                if ( !behavioursStillActive && this.unloadOnExit ) {

                    Runtime.disposables.push( this );

                    // Assets
                    for ( const assset of assets ) {
                        assset.containerRefCount--;
                        if ( assset.containerRefCount === 0 ) {
                            Runtime.disposables.push( assset );
                            toRemove.push( assset );
                        }
                    }

                    // Groups
                    for ( const group of groups ) {
                        group.containerRefCount--;
                        if ( group.containerRefCount === 0 ) {
                            Runtime.disposables.push( group );
                            toRemove.push( group );
                        }
                    }

                    // Remove the assets & groups from this container
                    for ( const assetToRemove of toRemove ) {
                        if ( assets.indexOf( assetToRemove ) !== -1 )
                            assets.splice( assets.indexOf( assetToRemove ), 1 );
                        else if ( groups.indexOf( assetToRemove as Group ) !== -1 )
                            groups.splice( groups.indexOf( assetToRemove as Group ), 1 );
                    }
                }

                // Notify the plugins
                const plugins = Runtime.plugins;
                for ( const plugin of plugins )
                    plugin.onContainerExit( this, portal, behavioursStillActive );

                if ( behavioursStillActive === false )
                    Runtime.activeItems.splice( Runtime.activeItems.indexOf( this ), 1 );

                return;
            }

            // If already loaded - just do as it normally would
            if ( this.loaded ) {
                super.enter( portalName, portal );

                const params = this.parameters;
                for ( const param of params )
                    param.go();

                if ( portal.type === 'input' ) {
                    const plugins = Runtime.plugins;
                    for ( const plugin of plugins )
                        plugin.onContainerEnter( this );

                    portal.go();
                }

                return;
            }

            // If loading, we keep track of the portal and call it again when everything is loaded.
            if ( this.isLoading ) {
                this.portalsToExecute.push( portal );
                return;
            }

            // If this container needs to be loaded
            this.startOnLoad = true;
            this.isLoading = true;
            this.portalsToExecute.push( portal );
            this.load();
        }

        /**
         * Called after a parameter / product has been set externally.
         * @param {Portal} parameter The parameter that was set.
         */
        parameterFilled( parameter: Portal ) {

            // Get all instances to exit
            const activeInstances = this.activeInstances;
            let portal: Portal;

            for ( const activeInstance of activeInstances ) {
                const portals = activeInstance.portals;
                for ( const portal of portals ) {
                    if ( portal.name === parameter.name ) {
                        portal.value = parameter.value;
                        break;
                    }
                }
            }
        }

        onLoaded( portalName, portal ) {
        }

        /**
         * Called when the container needs to execute all its input portals
         */
        start() {

            const inputs = this.inputs;
            const parameters = this.parameters;

            for ( const param of parameters )
                param.go();

            for ( const input of inputs )
                input.go();
        }

        /**
         * Called when an asset is loaded
         */
        onAssetLoaded( response: Events.AssetEvents, event: Events.IAssetEvent, sender?: EventDispatcher ) {
            this.mNumLoaded++;
            event.asset.off<Events.AssetEvents, Events.IAssetEvent>( 'asset-loaded', this.onAssetLoaded, this );
            Runtime.containerLoadProgress( this.runtime, this, parseInt(( ( this.mNumLoaded / this.mNumToLoad ) * 100 ).toString() ) );
            if ( this.mNumLoaded >= this.mNumToLoad )
                this.onLoadComplete();
        }

        /**
         * Called when all assets have completed loading
         */
        onLoadComplete() {

            // Initialize all the assets
            const assets = this.assets;
            for ( const asset of assets ) {
                if ( asset.initialized === false ) {
                    asset.initialize();
                    asset.initialized = true;
                }
            }

            this.loaded = true;
            this.emit<Events.ContainerEvents, Events.IContainerEvent>( 'container-loaded', this );

            // If we have to execute after its loaded.
            if ( this.startOnLoad ) {
                this.startOnLoad = true;
                this.isLoading = false;
                const portals = this.portalsToExecute;
                const plugins = Runtime.plugins;

                for ( const plugin of plugins )
                    plugin.onContainerEnter( this );

                for ( const portal of portals ) {
                    Behaviour.prototype.enter.call( this, portal.name, portal );

                    const params = this.parameters;
                    for ( const param of params )
                        param.go();

                    if ( portal.type === 'input' )
                        portal.go();
                }
            }
        }
    }
}