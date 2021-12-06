interface IDateTime {
        function isLeapYear(uint16 year) external returns (bool);
        function getYear(uint timestamp) external returns (uint16);
        function getMonth(uint timestamp) external returns (uint8);
        function getDay(uint timestamp) external returns (uint8);
        function getHour(uint timestamp) external returns (uint8);
        function getMinute(uint timestamp) external returns (uint8);
        function getSecond(uint timestamp) external returns (uint8);
        function getWeekday(uint timestamp) external returns (uint8);
        function toTimestamp(uint16 year, uint8 month, uint8 day) external returns (uint timestamp);
        function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour) external returns (uint timestamp);
        function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour, uint8 minute) external returns (uint timestamp);
        function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour, uint8 minute, uint8 second) external returns (uint timestamp);
}