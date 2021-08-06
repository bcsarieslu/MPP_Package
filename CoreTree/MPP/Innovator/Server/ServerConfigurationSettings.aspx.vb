
Imports System.Xml
Imports System.IO

Partial Class ServerConfigurationSetting
    Inherits System.Web.UI.Page

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        Try

            If Me.IsPostBack = False Then
                'System.Diagnostics.Debugger.Break()
                GetConfigSetting()
            End If
        Catch ex As Exception

        End Try
    End Sub


    Private Sub GetConfigSetting()
        Dim LoXML As XmlDocument = Nothing, LoRoot As XmlNode = Nothing, LoErrNode As XmlNode = Nothing, LoConfigXML As XmlDocument = Nothing, LoConfigRoot As XmlNode, LoNode As XmlNode, LoCloneNode As XmlNode
        Dim LstrPath As String, LstrFileName As String, LstrName As String

        Try

            LoRoot = RetrieveXmlNodeByXmlFile(LoXML, "<sections></sections>")
            SetXMLAttribute(LoRoot, "iserror", "")
            LoErrNode = AddElement(LoXML, LoRoot, "error")

            LstrName = Request.QueryString("name")
            If LstrName Is Nothing Then LstrName = ""

            LstrFileName = "bcs.Configuration.Settings.xml"
            LstrPath = HttpContext.Current.Server.MapPath(HttpContext.Current.Request.ApplicationPath)
            If LstrPath.Substring(LstrPath.Length - 1) <> "\" Then LstrPath = LstrPath & "\"

            If File.Exists(LstrPath & LstrFileName) = True Then
                If LstrName <> "" Then
                    LoConfigXML = New XmlDocument
                    LoConfigXML.Load(LstrPath & LstrFileName)
                    LoConfigRoot = CType(LoConfigXML.DocumentElement, XmlNode)
                    LoNode = LoConfigRoot.SelectSingleNode("section[@name='" & LstrName & "']")
                    If Not LoNode Is Nothing Then
                        LoCloneNode = LoXML.ImportNode(LoNode, True)
                        LoRoot.AppendChild(LoCloneNode)
                        SetXMLAttribute(LoRoot, "iserror", "false")
                    Else
                        LoErrNode.InnerText = "Can not get the definition.(" & LstrName & ")"
                        SetXMLAttribute(LoRoot, "iserror", "true")
                    End If
                Else
                    LoErrNode.InnerText = "The parameter is not correct."
                    SetXMLAttribute(LoRoot, "iserror", "true")
                End If
            Else
                SetXMLAttribute(LoRoot, "iserror", "true")
                LoErrNode.InnerText = "File does not exist.(" & LstrFileName & ")"
            End If

            Response.Write(LoRoot.OuterXml)
        Catch ex As Exception
            'ex.Message 
            If Not LoRoot Is Nothing Then
                SetXMLAttribute(LoRoot, "iserror", "true")
                If Not LoErrNode Is Nothing Then LoErrNode.InnerText = ex.Message
                Response.Write(LoRoot.OuterXml)
            End If
        End Try
    End Sub

    Private Function RetrieveXmlNodeByXmlFile(ByRef oXML As XmlDocument, ByVal strXmlFile As String) As XmlNode
        Dim LoRoot As XmlNode = Nothing

        Try
            If strXmlFile Is Nothing Then Return LoRoot

            If oXML Is Nothing Then oXML = New XmlDocument

            oXML.LoadXml(strXmlFile)
            If oXML.DocumentElement Is Nothing Then Return LoRoot
            LoRoot = CType(oXML.DocumentElement, XmlNode)

            Return LoRoot

        Catch ex As Exception
            'CErrException = ex.Message & vbNewLine & ex.StackTrace
            Return LoRoot
        End Try
    End Function

    Private Sub SetXMLAttribute(ByRef oElement As XmlElement, ByVal strAttribute As String, ByVal strValue As String)
        Try
            oElement.SetAttribute(strAttribute, strValue)
        Catch ex As Exception
            'CErrException = ex.Message & vbNewLine & ex.StackTrace
        End Try
    End Sub

    Private Sub SetXMLAttribute(ByRef oNode As XmlNode, ByVal strAttribute As String, ByVal strValue As String)
        Dim LoElement As XmlElement
        Try
            LoElement = CType(oNode, XmlElement)
            LoElement.SetAttribute(strAttribute, strValue)
        Catch ex As Exception
            'CErrException = ex.Message & vbNewLine & ex.StackTrace
        End Try
    End Sub


#Region "                AddElement"

    Public Function AddElement(ByRef LoXmlPaser As XmlDocument, ByRef LoParNode As XmlNode, ByVal LstrEltname As String) As XmlNode
        Dim LoChildNode As XmlNode = Nothing
        'Dim LoTextnode As XmlNode

        Try
            LoChildNode = LoXmlPaser.CreateElement(LstrEltname)
            'domNode.Text = strText
            LoParNode.AppendChild(LoChildNode)
            Return LoChildNode

        Catch ex As Exception
            'CErrException = ex.Message & vbNewLine & ex.StackTrace
            Return LoChildNode
        End Try

    End Function

    Public Function AddElement(ByRef LoXmlPaser As XmlDocument, ByRef LoParNode As XmlNode, ByVal LstrEltname As String, ByVal LstrText As String) As XmlNode
        Dim LoChildNode As XmlNode = Nothing
        Dim LoTextnode As XmlNode

        Try
            LoChildNode = LoXmlPaser.CreateElement(LstrEltname)
            LoTextnode = LoXmlPaser.CreateTextNode(LstrText)
            LoChildNode.AppendChild(LoTextnode)
            LoParNode.AppendChild(LoChildNode)
            Return LoChildNode

        Catch ex As Exception
            'CErrException = ex.Message & vbNewLine & ex.StackTrace
            Return LoChildNode
        End Try

    End Function

#End Region

End Class
