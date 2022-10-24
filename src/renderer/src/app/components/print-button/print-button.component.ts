import { Component, OnInit } from "@angular/core";
import { IpcService } from "src/app/ipc.service";
@Component({
    selector:'printButton',// <printButton>
    templateUrl:'./print-button.component.html',
    styleUrls:['./print-button.component.css']

})
export class PrintButtonComponent implements OnInit{
    constructor (private ipcService: IpcService){}
    ngOnInit() {
    }

    printPDF(){
        console.log("pressed")
        alert("clicked!")
        // window.api.electronIpcSend()
        this.ipcService.openNewWindow()
    }

}