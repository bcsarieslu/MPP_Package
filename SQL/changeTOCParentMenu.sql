update innovator.COMMANDBARMENUBUTTON set PARENT_MENU=(select [ID] from innovator.COMMANDBARMENU where [NAME] like '%toc_MPP')
where [NAME] like '%toc_PPR_%'