import { LightningElement, api, wire } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getAvailableFlights from '@salesforce/apex/FlightController.getAvailableFlights';
import TRIP_ID_FIELD from '@salesforce/schema/Trip__c.Id';
import FLIGHT_FIELD from '@salesforce/schema/Trip__c.Flight__c';

const COLUMNS = [
    { label: 'Flight Number', fieldName: 'Name' },
    { label: 'Start Time', fieldName: 'Start__c', type: 'date', typeAttributes: { 
        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' 
    }},
    { type: 'button', typeAttributes: { label: 'Select Flight', name: 'select_flight', variant: 'brand' }}
];

export default class TripFlightSelector extends LightningElement {
    @api recordId;
    columns = COLUMNS;
    flights;
    error;
    wiredFlightsResult;

    @wire(getAvailableFlights, { tripId: '$recordId' })
    wiredFlights(result) {
        this.wiredFlightsResult = result;
        if (result.data) {
            this.flights = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error.body.message;
            this.flights = undefined;
        }
    }

    handleRowAction(event) {
        const flightId = event.detail.row.Id;
        const fields = {};
        
        fields[TRIP_ID_FIELD.fieldApiName] = this.recordId;
        fields[FLIGHT_FIELD.fieldApiName] = flightId;
        
        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Flight booked successfully!',
                    variant: 'success'
                }));
                return refreshApex(this.wiredFlightsResult);
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error updating record',
                    message: error.body.message,
                    variant: 'error'
                }));
            });
    }
}
