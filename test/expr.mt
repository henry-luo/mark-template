{template 
	{dialog extend:'Dialog'
		{div 
			{h1 {this.header}}
			{apply}
			{footer}
		}
	} 
	{component match:'msg', extend:'Message'
		{p 
			{span style:{float:{this.model.user == this.model.parent().user ? 'right':'left'}}
				{this.model.user}
			}
			{this.msg_text}
		}
	}
	{footer 
		{div {'Copyright © 2015-' + (new Date().getFullYear() >= 2017 ? 2017:2016)}}
	}
}