namespace HatcheryRuntime {

    /**
     * Behaviours are objects that perform actions in an application. They are the base
     * class for all actionable tasks in Animate. Behaviours contain a list of Portals that trigger the various actions within them.
     * Each of those portals contain links that can point to and trigger other Behaviours based on the actions within.
     * You can think of Behaviours as state machines.
     */
    export class Behaviour extends EventDispatcher implements IRuntimeItem {
        public parameters: Portal[];
        public products: Portal[];
        public outputs: Portal[];
        public inputs: Portal[];
        public portals: Portal[];
        public isActive: boolean;
        public container: Container;
        public runtime: Runtime;
        public alias: string;
        public id: number;

        constructor( runtime: Runtime ) {
            super();
            this.parameters = [];
            this.products = [];
            this.outputs = [];
            this.inputs = [];
            this.portals = [];
            this.isActive = false;
            this.container = null;
            this.runtime = runtime;
        }

        /**
         * Gets all links connected to this behaviour
         * @returns {Link[]}
         */
        getLinks(): Link[] {
            const toRet: Link[] = [];
            const portals = this.portals;
            for ( const portal of portals )
                for ( const link of portal.links )
                    toRet.push( link );

            return toRet;
        }

        /**
         * Clones the behaviour
         * @parameter {Behaviour} val [Optional] The child parent clone
         */
        clone( val?: Behaviour ): Behaviour {
            if ( !val )
                val = new Behaviour( this.runtime );

            const portals = this.portals;
            let links: Link[];
            let newPortal: Portal;

            for ( const portal of portals ) {
                newPortal = val.addPortal( portal.type, portal.name, portal.value, portal.dataType );
                links = portal.links;
                for ( const link of links )
                    newPortal.addLink( link.clone() );
            }

            val.isActive = this.isActive;
            val.alias = this.alias;
            val.id = this.id;
            return val;
        }

        /**
         * This will get a parameter's value by its name
         * @param {string} name The name of the parameter
         * @returns {T} the parameter's value or null
         */
        getParam<T>( name: string ): T {
            const parameters = this.parameters;
            for ( const param of parameters ) {
                if ( param.name === name )
                    return param.value;
            }

            return null;
        }

        /**
         * This will set a product's value by its name
         * @param {string} name The name of the product
         * @param {T} value The value of the product
         * @returns {T} the parameter's value or null
         */
        setProduct<T>( name: string, value: T ): T {
            const products = this.products;
            for ( const product of products ) {
                if ( product.name === name ) {
                    product.value = value;
                    return value;
                }
            }

            return null;
        }

        /**
         * Called after a parameter or product has been set externally.
         * @param {Portal} parameter The parameter that was set.
         */
        parameterFilled( parameter: Portal ) {
        }

        /**
         * This function is called when the behaviour is entered by the execution context. This is where
         * all execution logic should go. The behaviour will remain active until this.exit() is called.
         * @param {string} portalName The name of the input portal we are entering through.
         * @param {Portal} portal The actual input portal we entered through
         */
        enter( portalName: string, portal: Portal ) {
            this.isActive = true;

            if ( Runtime.activeItems.indexOf( this ) === -1 )
                Runtime.activeItems.push( this );


            const parameters = this.parameters;
            for ( const param of parameters ) {
                const links = param.links;
                for ( const link of links ) {
                    param.value = link.startPortal.value;
                    break;
                }
            }
        }

        /**
         * Called after all the behaviours are loaded.
         */
        onInitialize() {
        }


        /**
         * Called when we enter a frame
         * @param {number} totalTime The total time from the start of the application
         * @param {number} delta The time between frames
         */
        onFrame( totalTime: number, delta: number ) {
        }

        /**
         * This is called when we want to deactivate the the behaviour and exit to another. This function will
         * tell a specific output portal that it has to execute its programming logic.
         * @param {string} portalName The name of the output portal to execute.
         * @param {boolean} keepActive Should calling this function turn off the behaviour
         */
        exit( portalName: string, keepActive: boolean = false ) {
            this.isActive = keepActive;

            if ( this.isActive === false && Runtime.activeItems.indexOf( this ) !== -1 )
                Runtime.activeItems.splice( Runtime.activeItems.indexOf( this ), 1 );

            // Push out any products
            const products = this.products;
            for ( const prod of products ) {
                const links = prod.links;
                for ( const link of links ) {
                    if ( link.endPortal ) {
                        link.endPortal.value = link.startPortal.value;
                        link.endBehaviour.parameterFilled( link.endPortal );
                    }
                }
            }

            const outputs = this.outputs;
            for ( const out of outputs ) {
                if ( portalName === out.name )
                    out.go();
            }
        }

        /**
         * Adds a portal to this behaviour.
         * @param {PortalType} type The type of portal we are adding.
         * @param {string} name The unique name of the Portal
         * @param {any} value The default value of the Portal
         * @param {DataType} dataType The data type that the portal value represents.
         * @returns {Portal} The portal that was added to this node
         */
        addPortal( type: PortalType, name: string, value: any, dataType: DataType ): Portal {
            const portal = new Portal( name, type, value, dataType, this );

            if ( type === 'parameter' )
                this.parameters.push( portal );
            else if ( type === 'product' )
                this.products.push( portal );
            else if ( type === 'output' )
                this.outputs.push( portal );
            else
                this.inputs.push( portal );

            this.portals.push( portal );
            return portal;
        }

        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose() {
            const portals = this.portals;
            for ( const portal of portals )
                portal.dispose();

            this.parameters = null;
            this.products = null;
            this.outputs = null;
            this.inputs = null;
            this.portals = null;
            this.runtime = null;
            this.container = null;
            super.dispose();
        }

    }
}
