import React from 'react';
import Select from 'react-select';

export default class RouteSelector extends React.Component {

    constructor () {
        super();
    }

    render() {
        return (
            <div id = "route_list_div">
                <Select
                    name="form-field-name"
                    options={this.props.routes}
                    onChange={this.props.handleChange.bind(this)}
                    multi={true}
                    simpleValue = {true}
                    joinValues = {true}
                    value={this.props.visibleRoutes}
                />
            </div>
        )
    }
}