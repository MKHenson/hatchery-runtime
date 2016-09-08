namespace HatcheryRuntime {

    /**
     * This factory is used to create the standard behaviours
     */
    export class LiveBehaviourFactory implements IBehaviourFactory {

        /**
         * Creates a new behaviour
         * @param {any} data The data object which defines what to create
         * @param {Runtime} runtime The runtime we are adding this behaviour to
         * @returns {Behaviour} The Behaviour we have created
         */
        create( data: any, runtime: Runtime ): Behaviour {
            if ( data.type === 'BehaviourAsset' )
                return new AssetBehaviour( runtime );
            else if ( data.type === 'BehaviourInstance' )
                return new InstanceBehaviour( data.originalContainerID, runtime );
            else if ( data.type === 'BehaviourScript' ) {
                const CustomClass: any = this.stringToFunction( 'Animate._AnCS' + data.shallowId );
                if ( !CustomClass )
                    return null;

                return new CustomClass();
            }

            return null;
        }

        /**
         * Creates a class from a  string
         * @param {string} str The name of the class we want to create
         * @returns {anyany | boolean} Returns the constructor function of the class or false
         */
        stringToFunction( str: string ): any | boolean {
            const arr: Array<string> = str.split( '.' );
            let fn = ( window || this );
            for ( let i = 0, len = arr.length; i < len; i++ )
                fn = fn[ arr[ i ] ];

            if ( typeof fn !== 'function' )
                false;

            return <any>fn;
        }
    }
}
