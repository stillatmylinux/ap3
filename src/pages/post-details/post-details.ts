import {NavController, NavParams, ModalController, Platform, ViewController} from 'ionic-angular';
import {Component, Renderer, ElementRef} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {SocialSharing} from 'ionic-native';

import {MediaPlayer} from '../media-player/media-player';

@Component({
  templateUrl: 'post-details.html'
})
export class PostDetailsPage {
  selectedItem: any;
  content: any;
  listenFunc: Function;
  rtlBack: boolean = false

  constructor(
    public nav: NavController, 
    navParams: NavParams, 
    public sanitizer: DomSanitizer,
    public modalCtrl: ModalController,
    public renderer: Renderer,
    public elementRef: ElementRef,
    public viewCtrl: ViewController,
    public platform: Platform
    ) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');

    this.content = sanitizer.bypassSecurityTrustHtml( this.selectedItem.content.rendered );

    // Listen for link clicks, open in in app browser
    this.listenFunc = renderer.listen(elementRef.nativeElement, 'click', (event) => {
      if( event.target.href && event.target.href.indexOf('http') >= 0 ) {
        event.preventDefault();
        window.open( event.target.href, '_blank' );
      }
    });

    if( platform.is('android') ) {
      this.killVideos()
    }

  }

  ionViewWillEnter() {

    if( this.platform.isRTL() && this.viewCtrl.enableBack() ) {
        this.viewCtrl.showBackButton(false)
        this.rtlBack = true
    }
 
  }

  mediaModal( src, img = null ) {

    let modal = this.modalCtrl.create(MediaPlayer, {source: src, image: img});
    modal.present();

  }

  share() {

    SocialSharing.share( this.selectedItem.title.rendered, null, null, this.selectedItem.link ).then(() => {
      // Sharing via email is possible
    }).catch(() => {
      // Sharing via email is not possible
    });

  }

  // changes the back button transition direction if app is RTL
  backRtlTransition() {
    let obj = {}

    if( this.platform.is('ios') )
      obj = {direction: 'forward'}
    
    this.nav.pop( obj )
  }

  // stop videos from playing when app is exited, required by Google
  killVideos() {

    // todo: if platform = android
    this.platform.pause.subscribe(() => {

      let frames = this.elementRef.nativeElement.getElementsByTagName('iframe')

      let Vidsrc

      for (let i in frames) {

        if( /youtube|wistia|vimeo/.test(frames[i].src) ) {
           Vidsrc = frames[i].src;
           frames[i].src = '';
           setTimeout( function() {
               frames[i].src = Vidsrc;
           }, 500);
        }

      }
      
    })

  }

}
