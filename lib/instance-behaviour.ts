namespace HatcheryRuntime {

    /**
     * This behaviour simply acts as a place holder for a container.
     */
    export class InstanceBehaviour extends Behaviour  {
        public instance: Container;
        public containerID: number;

        /**
         * @param {number} containerID The id of the container
         */
        constructor( containerID: number, runtime: Runtime ) {
            super(runtime);

            this.containerID = containerID;
            this.instance = null;
        }

        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose() {
            this.containerID = null;
            this.instance = null;
            super.dispose();
        }

        /**
         * This function is called when the behaviour is entered by the execution context. This is where
         * all execution logic should go. The behaviour will remain active until this.exit() is called.
         * @param {string} portalName The name of the input portal we are entering through.
         * @param {Portal} portal The actual input portal we entered through
         */
        enter( portalName: string, portal: Portal ) {
            super.enter( portalName, portal);

            let containerPortal: Portal = null;
            let targetContainer = this.instance;

            // If disposed, then cleanup
            if ( targetContainer.disposed ) {
                this.dispose();
                return;
            }

            // For each of the container portals
            const portals = targetContainer.portals;
            for ( const portal of portals ) {

                // If the portal is a parameter then assign the instance value to the container's
                if ( portal.type === 'parameter' )
                    portal.value = this.getParam( portal.name );

                // If the container portal name is the same as the one being executed in the instance,
                // then we found the target container portal
                if ( !containerPortal && portalName === portal.name)
                    containerPortal = portal;
            }

            // Re-parent the target container so that its the child of the instance container
            targetContainer.container = this.container;

            // Add this instance to the target's list of active instances
            if ( targetContainer.activeInstances.indexOf( this ) === -1)
                targetContainer.activeInstances.push( this );

            // Finally enter the target from the relevant portal
            targetContainer.enter( portalName, containerPortal);
        }

        /**
         * This is called when we want to deactivate the the behaviour and exit to another. This function will
         * tell a specific output portal that it has to execute its programming logic.
         * @param {string} portalName The name of the output portal to execute.
         * @param {boolean} keepActive Should calling this function turn off the behaviour
         */
        exit( portalName: string, keepActive: boolean = false ) {
            super.exit( portalName, keepActive );
            this.instance.activeInstances.splice( this.instance.activeInstances.indexOf( this ), 1 );
        }
    }
}
