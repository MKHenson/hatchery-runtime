namespace HatcheryRuntime {

    /**
     * A portal class for behaviours. There are 4 different types of portals (See PortalType). Each portal acts as a gate for a behaviour
     * and triggers some kind of action within it
     */
    export class Portal extends EventDispatcher {

        public name: string;
        public value: any;
        public links: Link[];
        public type: PortalType;
        public behaviour: Behaviour;
        public dataType: DataType;

        /**
         * @param {string} name The name of the portal
         * @param {PortalType} type The portal type. This can be either Portal.INPUT, Portal.OUTPUT, Portal.PARAMETER or Portal.PRODUCT
         * @param {any} value The default value of the portal
         * @param {DataType} dataType The type of value this portal represents - eg: asset, string, number, file...etc
         * @param {Behaviour} behaviour The behaviour this portal is attached to
         */
        constructor( name: string, type: PortalType, value: any, dataType: DataType, behaviour: Behaviour ) {

            super();
            this.name = name;
            this.value = value;
            this.links = [];
            this.type = type;
            this.behaviour = behaviour;
            this.dataType = dataType;
        }

        /**
         * This function will check if the source portal is an acceptable match with the current portal.
         */
        dispose() {
            const links = this.links;
            for ( const link of links ) {
                if ( link.disposed === false )
                    link.dispose();
            }

            this.links = null;
            this.value = null;
            this.behaviour = null;
            this.type = null;
            this.dataType = null;
            this.name = null;
        }

        /**
         * This function will make the portal execute its links. These may in turn trigger other portals on other behaviours
         */
        go() {
            const links = this.links;
            for ( const link of links ) {
                if ( link.frameDelay === 0 ) {
                    if ( link.endPortal.type === 'input' )
                        link.endBehaviour.enter( link.endPortal.name, link.endPortal );
                    else if ( link.endBehaviour instanceof Container && link.endPortal.type === 'output' )
                        link.endBehaviour.enter( link.endPortal.name, link.endPortal );
                }
                else {
                    Runtime.activeItems.push( link );
                    link.currentFrame++;
                }
            }
        }

        /**
         * Adds a link to the portal.
         * @param {Link} link The link we are adding
         * @returns {Link}
         */
        addLink( link: Link ): Link {
            if ( this.links.indexOf( link ) === -1 )
                this.links.push( link );

            return link;
        }

        /**
         * Removes a link from the portal.
         * @param {Link} link The link we are removing
         * @returns {Link}
         */
        removeLink( link: Link ): Link {
            if ( this.links.indexOf( link ) === -1 )
                return link;

            this.links.splice( this.links.indexOf( link ), 1 );
            return link;
        }
    }
}
