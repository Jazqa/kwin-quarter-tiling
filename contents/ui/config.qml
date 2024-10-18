import QtQuick
import QtQuick.Controls
import QtQuick.Window
import QtQuick.Layouts

ApplicationWindow {
    id: window
    title: qsTr("Tiling Options")
    visible: true
    width: 480
    height: 860
    minimumWidth: 440

    GridLayout {
        columns: 1
        columnSpacing: 20
        anchors.fill: parent
        anchors.margins: 20

        // Screens
        Frame {
            Layout.fillWidth: true
            Layout.minimumWidth: screensStack.width
            Layout.minimumHeight: screensTabBar.height + screensStack.height
            leftPadding: 0
            topPadding: 0

            TabBar {
                id: screensTabBar
                Repeater {
                    model: Qt.application.screens.length
                    TabButton {
                        text: qsTr("Screen ") + (index + 1)
                    }
                }
            }
            StackLayout {
                anchors.top: screensTabBar.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                id: screensStack
                currentIndex: screensTabBar.currentIndex
                Repeater {
                    model: Qt.application.screens.length
                    GridLayout {
                        columns: 2

                        Item {
                            width: 200
                        }

                        Item {
                            width: 200
                        }

                        Label {
                            Layout.alignment: Qt.AlignRight
                            text: qsTr("Device:")
                        }
                        Label {
                            text: Qt.application.screens[index].model
                        }

                        Label {
                            Layout.alignment: Qt.AlignRight
                            text: qsTr("Enabled:")
                        }
                        CheckBox {
                            Layout.leftMargin: -5
                            objectName: "kcfg_outputEnabled_" + index
                        }

                        Label {
                            Layout.alignment: Qt.AlignRight
                            text: qsTr("Layout:")
                        }
                        ComboBox {
                            model: [qsTr("2x2 Horizontal"), qsTr(
                                    "2x2 Vertical")]
                            objectName: "kcfg_layout_" + index
                        }

                        Label {
                            Layout.alignment: Qt.AlignRight
                            text: qsTr("Window limit:")
                        }
                        SpinBox {
                            from: -1
                            value: -1
                            objectName: "kcfg_maxWindows_" + index
                            textFromValue: function (value) {
                                return value < 0 ? "∞" : value
                            }
                        }

                        Item {
                            height: 20
                        }
                    }
                }
            }
        }

        // Misc
        Frame {
            Layout.fillWidth: true
            Layout.minimumWidth: checksGrid.width
            Layout.minimumHeight: checksGrid.height + checksLabel.height
                                  + checksLabel.height + checksLabel.height

            Label {
                id: checksLabel
                text: "General"
            }

            GridLayout {
                anchors.top: checksLabel.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                id: checksGrid
                columns: 2
                Item {
                    width: 200
                }

                Item {
                    width: 200
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Automatically tile windows:")
                }
                CheckBox {
                    Layout.leftMargin: -5
                    objectName: "kcfg_autoTile"
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Automatically switch desktops:")
                }
                CheckBox {
                    Layout.leftMargin: -5
                    objectName: "kcfg_followWindows"
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Exclude Java windows:")
                }
                CheckBox {
                    Layout.leftMargin: -5
                    objectName: "kcfg_ignoreJava"
                }
            }
        }

        // Margins
        Frame {
            Layout.fillWidth: true
            Layout.minimumWidth: marginsRows.width
            Layout.minimumHeight: marginsRows.height + marginsLabel.height
                                  + marginsLabel.height + marginsLabel.height

            Label {
                id: marginsLabel
                text: qsTr("Margins")
            }

            RowLayout {
                anchors.top: marginsLabel.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                id: marginsRows

                ColumnLayout {
                    Label {
                        Layout.alignment: Qt.AlignCenter
                        text: qsTr("Left")
                    }
                    SpinBox {
                        from: 0
                        value: 0
                        objectName: "kcfg_marginLeft"
                    }
                }
                ColumnLayout {
                    Label {
                        Layout.alignment: Qt.AlignCenter
                        text: qsTr("Top")
                    }
                    SpinBox {
                        from: 0
                        value: 0
                        objectName: "kcfg_marginTop"
                    }

                    Label {
                        Layout.alignment: Qt.AlignCenter
                        text: qsTr("Between")
                    }
                    SpinBox {
                        from: 1
                        value: 1
                        objectName: "kcfg_gaps"
                    }

                    Label {
                        Layout.alignment: Qt.AlignCenter
                        text: qsTr("Bottom")
                    }
                    SpinBox {
                        from: 0
                        value: 0
                        objectName: "kcfg_marginBottom"
                    }
                }
                ColumnLayout {
                    Label {
                        Layout.alignment: Qt.AlignLeft
                        text: qsTr("Right")
                    }
                    SpinBox {
                        from: 0
                        value: 0
                        objectName: "kcfg_marginLeft"
                    }
                }
            }
        }

        // Excluded
        Frame {
            Layout.fillWidth: true
            Layout.minimumWidth: excludedGrid.width
            Layout.minimumHeight: excludedGrid.height + excludedLabel.height
                                  + excludedLabel.height + excludedLabel.height

            Label {
                id: excludedLabel
                text: qsTr("Excluded")
            }

            GridLayout {
                anchors.top: excludedLabel.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                id: excludedGrid
                columns: 2

                Item {
                    width: 200
                }

                Item {
                    width: 200
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Width:")
                }
                SpinBox {

                    from: 64
                    to: 1024
                    value: 256
                    objectName: "kcfg_minWidth"
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Height:")
                }
                SpinBox {
                    from: 64
                    to: 1024
                    value: 256
                    objectName: "kcfg_minHeight"
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Activities:")
                }
                ScrollView {
                    TextArea {
                        implicitWidth: 100
                        implicitHeight: 30
                        text: ""
                        objectName: "kcfg_ignoredActivities"
                    }
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Desktops:")
                }
                ScrollView {
                    TextArea {
                        implicitWidth: 100
                        implicitHeight: 30
                        text: ""
                        objectName: "kcfg_ignoredDesktops"
                    }
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Processes:")
                }
                ScrollView {
                    TextArea {
                        implicitWidth: 180
                        implicitHeight: 30
                        text: "wine, kate, steam"
                        objectName: "kcfg_ignoredProcesses"
                    }
                }

                Label {
                    Layout.alignment: Qt.AlignRight
                    text: qsTr("Titles:")
                }
                ScrollView {
                    TextArea {
                        implicitWidth: 180
                        implicitHeight: 30
                        text: "Move to trash, Quit GIMP"
                        objectName: "kcfg_ignoredCaptions"
                    }
                }
            }
        }
        Item {
            Layout.fillHeight: true
        }
    }
}
