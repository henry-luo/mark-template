{template 
	{dialog extend:'Dialog'
		{div 
			{h1 {this.header}}
			{for each:'m', of:{this.model.contents()}
				{apply to:{m}}
			}
			{footer
				 {copyright} 
			}
		}
	} 
	{msg extend:'Message'
		{p 
			{if is:{this.model.user == this.model.parent().user}
				{span style:{float:'right'} {this.model.user}}			
			}
			{else
				{span style:{float:'left'} {this.model.user}}
			}
			{this.msg_text}
		}
	}
	{footer 
		{div
			{compose}
		}
	}
	{copyright
		{'Copyright © 2015-' + (new Date().getFullYear() >= 2017 ? 2017:2016)}
	}
}