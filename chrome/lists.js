function getOpenTrackerList(){
	var openTrackers = [
		{
			"name": "YW", 
			"domains": ["t.yesware.com/t"],
			"patterns": []
		},
		{
			"name": "SK", 
			"domains": ["track.getsidekick.com", "t.sigopn01.com", "t.senaluno.com", "t.senaldos.com", "t.senaltres.com", "t.senalquatro.com", "t.senalcinco.com", "t.sigopn02.com", "t.sigopn03.com", "t.sigopn04.com", "t.sigopn05.com", "t.signauxun.com", "t.signauxdeux.com", "t.signauxtrois.com", "t.signauxquatre.com", "t.signauxcinq.com", "t.signauxsix.com", "t.signauxsept.com", "t.signauxhuit.com", "t.signauxdix.com", "t.signauxneuf.com", "t.signaleuna.com", "t.signaledue.com", "t.signaletre.com", "t.signalequattro.com", "t.signalecinque.com", "t.strk01.email", "t.strk02.email", "t.strk03.email", "t.strk04.email", "t.strk05.email", "t.strk06.email", "t.strk07.email", "t.strk08.email", "t.strk09.email", "t.strk10.email", "t.strk11.email", "t.strk12.email", "t.strk13.email", "t.sidekickopen01.com", "t.sidekickopen02.com", "t.sidekickopen03.com", "t.sidekickopen04.com", "t.sidekickopen05.com", "t.sidekickopen06.com", "t.sidekickopen07.com", "t.sidekickopen08.com", "t.sidekickopen09.com", "t.sidekickopen10.com", "t.sidekickopen11.com", "t.sidekickopen12.com"],
			"patterns": []
		},
		{
			"name": "MT", 
			"domains": ["mailtrack.io/trace"],
			"patterns": []
		},
		{
			"name": "MC",
			"domains": ["mandrillapp.com/track","list-manage.com/track","list-manage1.com/track"],
			"patterns": ["*://*.mandrillapp.com/track/open*","*://*.list-manage.com/track/open*","*://*.list-manage1.com/track/open*"]
		},
		{
			"name": "SG",
			"domains": ["sendgrid.net/wf"],
			"patterns": ["*://*.sendgrid.net/wf/open*"]
		},
		{
			"name": "IC",
			"domains": ["icptrack.com/icp"],
			"patterns": ["*://*.icptrack.com/icp/track*"]
		},
		{
			"name": "BT",
			"domains": ["bl-1.com"],
			"patterns": ["*://*.bl-1.com/*"]
		},
		{
			"name": "MM",
			"domains": ["app.mixmax.com/api/track"],
			"patterns": []
		},
		{
			"name": "MTA",
			"domains": ["ping.answerbook.com"],
			"patterns": []
		}
	];
	return openTrackers;
}

function getClickTrackerList(){
	var clickTrackers = [
		{
			"name": "YW", 
			"domains": ["t.yesware.com/tl"],
			"patterns": [],
			"param": "ytl"
		},
		{
			"name": "SK", 
			"domains": ["track.getsidekick.com", "t.sigopn01.com", "t.senaluno.com", "t.senaldos.com", "t.senaltres.com", "t.senalquatro.com", "t.senalcinco.com", "t.sigopn02.com", "t.sigopn03.com", "t.sigopn04.com", "t.sigopn05.com", "t.signauxun.com", "t.signauxdeux.com", "t.signauxtrois.com", "t.signauxquatre.com", "t.signauxcinq.com", "t.signauxsix.com", "t.signauxsept.com", "t.signauxhuit.com", "t.signauxdix.com", "t.signauxneuf.com", "t.signaleuna.com", "t.signaledue.com", "t.signaletre.com", "t.signalequattro.com", "t.signalecinque.com", "t.strk01.email", "t.strk02.email", "t.strk03.email", "t.strk04.email", "t.strk05.email", "t.strk06.email", "t.strk07.email", "t.strk08.email", "t.strk09.email", "t.strk10.email", "t.strk11.email", "t.strk12.email", "t.strk13.email", "t.sidekickopen01.com", "t.sidekickopen02.com", "t.sidekickopen03.com", "t.sidekickopen04.com", "t.sidekickopen05.com", "t.sidekickopen06.com", "t.sidekickopen07.com", "t.sidekickopen08.com", "t.sidekickopen09.com", "t.sidekickopen10.com", "t.sidekickopen11.com", "t.sidekickopen12.com"],
			"patterns": [],
			"param": "t"
		},
		{
			"name": "MC",
			"domains": ["mandrillapp.com/track","list-manage.com/track","list-manage1.com/track"],
			"patterns": ["*://*.mandrillapp.com/track/click*","*://*.list-manage.com/track/click*","*://*.list-manage1.com/track/click*"]
		},
		{
			"name": "SG",
			"domains": ["sendgrid.net/wf"],
			"patterns": ["*://*.sendgrid.net/wf/click*"]
		},
		{
			"name": "IC",
			"domains": ["click.icptrack.com/icp"],
			"patterns": ["*://*.icptrack.com/icp/relay*"],
			"param": "destination"
		},
		{
			"name": "BT",
			"domains": ["bl-1.com"],
			"patterns": ["*://*.bl-1.com/*"],
			"param": "url"
		},
		{
			"name": "MM",
			"domains": ["links.mixmax.com/b"],
			"patterns": []
		},
		{
			"name": "MTA",
			"domains": ["ping.answerbook.com"],
			"patterns": []
		}
	];
	return clickTrackers;
}